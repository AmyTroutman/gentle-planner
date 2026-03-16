"""
migrate-tasks.py

One-time migration script: moves tasks from the old fragmented storage
(tasksByDay, weeks[id].weeklyTasks, calendarEntriesByDay task entries)
into the new flat `tasks` map on users/me.

Usage:
    pip install firebase-admin
    python scripts/migrate-tasks.py

Set GOOGLE_APPLICATION_CREDENTIALS to your service account key path before
running, or edit the firebase_admin.initialize_app() call below.

The script is idempotent — safe to run twice.
Old data (tasksByDay, weeks.*.weeklyTasks) is left in place as a backup.
Delete it manually from the Firebase console after verifying the migration.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta

# ── Firebase init ─────────────────────────────────────────────────────────────
# Option A: use GOOGLE_APPLICATION_CREDENTIALS env var (recommended)
firebase_admin.initialize_app()

# Option B: explicit service account key path
# cred = credentials.Certificate('path/to/serviceAccountKey.json')
# firebase_admin.initialize_app(cred)

db = firestore.client()
users_me_ref = db.collection('users').document('me')


# ── Helper: derive Sunday-based week ID ───────────────────────────────────────

def sunday_of(day_id: str) -> str:
    """Return the Sunday that starts the week containing day_id (YYYY-MM-DD)."""
    d = datetime.strptime(day_id, '%Y-%m-%d')
    # weekday(): Monday=0, Sunday=6
    # Subtract days since Sunday (Sunday=6 → 6 days back, Monday=0 → 1 day back)
    days_since_sunday = (d.weekday() + 1) % 7
    sunday = d - timedelta(days=days_since_sunday)
    return sunday.strftime('%Y-%m-%d')


# ── Main migration ────────────────────────────────────────────────────────────

def migrate():
    print('Reading users/me...')
    snap = users_me_ref.get()
    if not snap.exists:
        print('ERROR: users/me document does not exist.')
        return

    data = snap.to_dict()
    tasks_map: dict = {}

    today_count = 0
    week_count = 0
    month_count = 0
    calendar_removed = 0

    # ── Step 2a: tasksByDay → scope=today ─────────────────────────────────────
    tasks_by_day: dict = data.get('tasksByDay', {})
    for day_id, task_array in tasks_by_day.items():
        if not isinstance(task_array, list):
            continue
        for task in task_array:
            if not isinstance(task, dict) or not task.get('id'):
                continue
            new_task = {
                'id': task['id'],
                'title': task.get('title', ''),
                'done': task.get('done', False),
                'scope': 'today',
                'createdAt': task.get('createdAt', datetime.utcnow().isoformat() + 'Z'),
                'dayId': day_id,
                'weekId': sunday_of(day_id),
            }
            if task.get('doneAt'):
                new_task['doneAt'] = task['doneAt']
            if task.get('subtasks'):
                new_task['subtasks'] = task['subtasks']
            tasks_map[task['id']] = new_task
            today_count += 1

    # ── Step 2b: weeks[id].weeklyTasks → scope=week ───────────────────────────
    weeks: dict = data.get('weeks', {})
    for week_id, week_data in weeks.items():
        if not isinstance(week_data, dict):
            continue
        weekly_tasks = week_data.get('weeklyTasks', [])
        if not isinstance(weekly_tasks, list):
            continue
        for task in weekly_tasks:
            if not isinstance(task, dict) or not task.get('id'):
                continue
            new_task = {
                'id': task['id'],
                'title': task.get('title', ''),
                'done': task.get('done', False),
                'scope': 'week',
                'createdAt': task.get('createdAt', datetime.utcnow().isoformat() + 'Z'),
                'weekId': week_id,
            }
            if task.get('doneAt'):
                new_task['doneAt'] = task['doneAt']
            if task.get('subtasks'):
                new_task['subtasks'] = task['subtasks']
            if task['id'] not in tasks_map:
                tasks_map[task['id']] = new_task
                week_count += 1
            else:
                print(f'  SKIP duplicate id {task["id"]} ({task.get("title", "")[:40]})')

    # ── Step 2c: calendarEntriesByDay task entries → scope=month ─────────────
    calendar_by_day: dict = data.get('calendarEntriesByDay', {})
    cleaned_calendar: dict = {}
    for day_id, entry_array in calendar_by_day.items():
        if not isinstance(entry_array, list):
            cleaned_calendar[day_id] = entry_array
            continue
        kept = []
        for entry in entry_array:
            if not isinstance(entry, dict):
                kept.append(entry)
                continue
            tags = entry.get('tags', [])
            if 'task' in tags:
                # Migrate to tasks map as month-scope
                new_task = {
                    'id': entry['id'],
                    'title': entry.get('title', ''),
                    'done': entry.get('done', False),
                    'scope': 'month',
                    'createdAt': entry.get('createdAt', datetime.utcnow().isoformat() + 'Z'),
                    'dueDate': day_id,
                }
                if entry.get('doneAt'):
                    new_task['doneAt'] = entry['doneAt']
                tasks_map[entry['id']] = new_task
                month_count += 1
                calendar_removed += 1
            else:
                # Keep event/game entries, strip any leftover subtasks field
                clean = {k: v for k, v in entry.items() if k != 'subtasks'}
                kept.append(clean)
        cleaned_calendar[day_id] = kept

    # ── Step 4: Write to Firestore ────────────────────────────────────────────
    print(f'Writing {len(tasks_map)} tasks to Firestore...')
    users_me_ref.update({
        'tasks': tasks_map,
        'calendarEntriesByDay': cleaned_calendar,
        # tasksByDay and weeks.*.weeklyTasks are left in place as backup
    })

    # ── Step 5: Summary ───────────────────────────────────────────────────────
    print()
    print('Migration complete!')
    print(f'  today-scope tasks migrated:  {today_count}')
    print(f'  week-scope tasks migrated:   {week_count}')
    print(f'  month-scope tasks migrated:  {month_count}')
    print(f'  calendar task entries removed: {calendar_removed}')
    print()
    print('Next steps:')
    print('  1. Verify data looks correct in the Firebase console under users/me.tasks')
    print('  2. Once confirmed, manually delete tasksByDay and weeks.*.weeklyTasks')
    print('     from the Firebase console.')


if __name__ == '__main__':
    migrate()
