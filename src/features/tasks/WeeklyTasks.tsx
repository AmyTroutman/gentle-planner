import { useMemo, useState } from 'react'
import type { Task } from './tasks.types'
import { getTasksForWeek, addTask, toggleTask, deleteTask } from './taskHelpers'
import TaskItem from './TaskItem'

type Props = {
    tasks: Record<string, Task>
    setTasks: (updater: (prev: Record<string, Task>) => Record<string, Task>) => void
    weekId: string
}

export default function WeeklyTasks({ tasks, setTasks, weekId }: Props) {
    const [title, setTitle] = useState('')

    const weekTasks = useMemo(() => getTasksForWeek(tasks, weekId), [tasks, weekId])

    const { openTasks, doneTasks } = useMemo(() => {
        const open: Task[] = []
        const done: Task[] = []
        for (const t of weekTasks) (t.done ? done : open).push(t)
        return { openTasks: open, doneTasks: done }
    }, [weekTasks])

    function submit() {
        const cleaned = title.trim()
        if (!cleaned) return
        setTasks(prev => addTask(prev, { scope: 'week', weekId, title: cleaned }))
        setTitle('')
    }

    function handleUpdate(updated: Task) {
        setTasks(prev => ({ ...prev, [updated.id]: updated }))
    }

    return (
        <section style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a weekly task…"
                    style={{
                        flex: 1,
                        padding: '0.6rem 0.65rem',
                        borderRadius: 12,
                        border: '1px solid #d1d5db',
                        fontSize: '0.95rem',
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                />
                <button
                    onClick={submit}
                    disabled={!title.trim()}
                    style={{
                        padding: '0.6rem 0.75rem',
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
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>No tasks this week yet.</p>
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
                        Done ({doneTasks.length})
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
