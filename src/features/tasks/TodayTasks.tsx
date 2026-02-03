import { useMemo, useState } from 'react'
import type { Task } from './tasks.types'

type Props = {
    tasks: Task[]
    onAdd: (title: string) => void
    onToggle: (id: string) => void
    onDelete: (id: string) => void
}

export default function TodayTasks({ tasks, onAdd, onToggle, onDelete }: Props) {
    const [title, setTitle] = useState('')

    const { openTasks, doneTasks } = useMemo(() => {
        const open: Task[] = []
        const done: Task[] = []
        for (const t of tasks) (t.done ? done : open).push(t)
        return { openTasks: open, doneTasks: done }
    }, [tasks])

    function submit() {
        const cleaned = title.trim()
        if (!cleaned) return
        onAdd(cleaned)
        setTitle('')
    }

    return (
        <section style={{ display: 'grid', gap: '0.75rem' }}>
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
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') submit()
                    }}
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
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                    You're all clear, kid!
                </p>
            )}

            {/* Open tasks */}
            {openTasks.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                    {openTasks.map((t) => (
                        <li
                            key={t.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.65rem 0.75rem',
                                borderRadius: 12,
                                border: '1px solid #d1d5db',
                                background: 'white',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={t.done}
                                onChange={() => onToggle(t.id)}
                            />
                            <span style={{ flex: 1 }}>{t.title}</span>
                            <button
                                onClick={() => onDelete(t.id)}
                                style={{
                                    border: '1px solid transparent',
                                    background: 'transparent',
                                    color: 'var(--muted)',
                                    cursor: 'pointer',
                                }}
                                title="Delete"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Done tasks */}
            {doneTasks.length > 0 && (
                <details>
                    <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>
                        Completed ({doneTasks.length})
                    </summary>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}>
                        {doneTasks.map((t) => (
                            <li
                                key={t.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    padding: '0.65rem 0.75rem',
                                    borderRadius: 12,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    opacity: 0.8,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={t.done}
                                    onChange={() => onToggle(t.id)}
                                />
                                <span style={{ flex: 1, textDecoration: 'line-through' }}>
                                    {t.title}
                                </span>
                                <button
                                    onClick={() => onDelete(t.id)}
                                    style={{
                                        border: '1px solid transparent',
                                        background: 'transparent',
                                        color: 'var(--muted)',
                                        cursor: 'pointer',
                                    }}
                                    title="Delete"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </section>
    )
}
