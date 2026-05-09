import { useMemo, useState } from 'react'
import type { Task } from './tasks.types'
import type { CalendarEntry } from '../calendar/calendar.types'
import { getTasksForDay, addTask, toggleTask, deleteTask } from './taskHelpers'
import TaskItem from './TaskItem'

const TAG_COLORS: Record<string, string> = {
    event: '#0ea5e9',
    game: '#00653e',
    work: '#42f5d7',
}

type Props = {
    tasks: Record<string, Task>
    setTasks: (updater: (prev: Record<string, Task>) => Record<string, Task>) => void
    dayId: string
    weekId: string
    calendarEntries?: CalendarEntry[]
}

export default function TodayTasks({ tasks, setTasks, dayId, weekId, calendarEntries = [] }: Props) {
    const [title, setTitle] = useState('')

    const dayTasks = useMemo(() => getTasksForDay(tasks, dayId), [tasks, dayId])

    const { openTasks, doneTasks } = useMemo(() => {
        const open: Task[] = []
        const done: Task[] = []
        for (const t of dayTasks) (t.done ? done : open).push(t)
        return { openTasks: open, doneTasks: done }
    }, [dayTasks])

    function submit() {
        const cleaned = title.trim()
        if (!cleaned) return
        setTasks(prev => addTask(prev, { scope: 'today', dayId, weekId, title: cleaned }))
        setTitle('')
    }

    function handleUpdate(updated: Task) {
        setTasks(prev => ({ ...prev, [updated.id]: updated }))
    }

    return (
        <section style={{ display: 'grid', gap: '0.75rem' }}>
            {calendarEntries.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
                    {calendarEntries.map(entry => (
                        <li key={entry.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 10,
                            border: '1px solid #e5e7eb',
                            background: '#faf5f1',
                            fontSize: '0.9rem',
                        }}>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                {entry.tags.map(tag => (
                                    <span key={tag} style={{ color: TAG_COLORS[tag] ?? 'var(--muted)', fontWeight: 600, fontSize: '0.72rem' }}>
                                        {tag.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                            <span style={{ flex: 1 }}>{entry.title}</span>
                        </li>
                    ))}
                </ul>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Dew it!"
                    style={{
                        flex: 1,
                        padding: '0.7rem 0.75rem',
                        borderRadius: 12,
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                />
                <button
                    onClick={submit}
                    disabled={!title.trim()}
                    style={{
                        padding: '0.7rem 0.9rem',
                        borderRadius: 12,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        opacity: title.trim() ? 1 : 0.6,
                    }}
                >
                    Add
                </button>
            </div>

            {openTasks.length === 0 && (
                <p style={{ margin: 0, color: 'var(--muted)' }}>You're all clear, kid!</p>
            )}

            {openTasks.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                    {openTasks.map((t) => (
                        <TaskItem
                            key={t.id}
                            task={t}
                            onToggle={() => setTasks(prev => toggleTask(prev, t.id))}
                            onDelete={() => setTasks(prev => deleteTask(prev, t.id))}
                            onUpdate={handleUpdate}
                        />
                    ))}
                </ul>
            )}

            {doneTasks.length > 0 && (
                <details>
                    <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>
                        Completed ({doneTasks.length})
                    </summary>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}>
                        {doneTasks.map((t) => (
                            <TaskItem
                                key={t.id}
                                task={t}
                                onToggle={() => setTasks(prev => toggleTask(prev, t.id))}
                                onDelete={() => setTasks(prev => deleteTask(prev, t.id))}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </ul>
                </details>
            )}
        </section>
    )
}
