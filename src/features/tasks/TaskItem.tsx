import { useState, useRef } from 'react'
import type { Task, Subtask } from './tasks.types'

type Props = {
    task: Task
    onToggle: () => void
    onDelete: () => void
    onUpdate: (updated: Task) => void
}

export default function TaskItem({ task, onToggle, onDelete, onUpdate }: Props) {
    const [expanded, setExpanded] = useState(false)
    const [addingSubtask, setAddingSubtask] = useState(false)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const subtasks = task.subtasks ?? []
    const doneCount = subtasks.filter((s) => s.done).length
    const hasSubtasks = subtasks.length > 0

    function handleAddSubtask() {
        const title = newSubtaskTitle.trim()
        if (!title) return
        const subtask: Subtask = {
            id: crypto.randomUUID(),
            title,
            done: false,
            createdAt: new Date().toISOString(),
        }
        onUpdate({ ...task, subtasks: [...subtasks, subtask] })
        setNewSubtaskTitle('')
        // keep input open for rapid entry
        inputRef.current?.focus()
    }

    function handleToggleSubtask(id: string) {
        onUpdate({
            ...task,
            subtasks: subtasks.map((s) =>
                s.id === id ? { ...s, done: !s.done } : s
            ),
        })
    }

    function handleDeleteSubtask(id: string) {
        onUpdate({ ...task, subtasks: subtasks.filter((s) => s.id !== id) })
    }

    function handleExpandToggle() {
        const next = !expanded
        setExpanded(next)
        if (next) setAddingSubtask(false)
    }

    function handleStartAdding() {
        setExpanded(true)
        setAddingSubtask(true)
        setTimeout(() => inputRef.current?.focus(), 0)
    }

    return (
        <li style={{ display: 'grid', gap: 0 }}>
            {/* Main task row */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '18px 1fr auto',
                    alignItems: 'center',
                    columnGap: '0.45rem',
                    padding: '0.65rem 0.75rem',
                    borderRadius: expanded ? '12px 12px 0 0' : 12,
                    border: '1px solid #d1d5db',
                    borderBottom: expanded ? '1px solid #e5e7eb' : '1px solid #d1d5db',
                    background: 'white',
                    transition: 'border-radius 0.15s',
                }}
            >
                <input
                    type="checkbox"
                    checked={task.done}
                    onChange={onToggle}
                    style={{ margin: 0, width: 18, height: 18, cursor: 'pointer', accentColor: '#2c454d' }}
                />

                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                        lineHeight: 1.25,
                        textDecoration: task.done ? 'line-through' : 'none',
                        color: task.done ? 'var(--muted)' : 'inherit',
                    }}>
                        {task.title}
                    </span>

                    {/* Subtask progress badge */}
                    {hasSubtasks && (
                        <button
                            onClick={handleExpandToggle}
                            style={{
                                padding: '0.1rem 0.45rem',
                                borderRadius: 20,
                                border: '1px solid #d1d5db',
                                background: doneCount === subtasks.length ? '#dcfce7' : '#f3f4f6',
                                color: doneCount === subtasks.length ? '#166534' : 'var(--muted)',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                lineHeight: 1.4,
                            }}
                        >
                            {expanded ? '▲' : '▼'} {doneCount}/{subtasks.length}
                        </button>
                    )}
                </div>

                {/* Right-side actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <button
                        onClick={handleStartAdding}
                        title="Add subtask"
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '0.1rem 0.3rem',
                            lineHeight: 1,
                            opacity: 0.5,
                        }}
                    >
                        ⊕
                    </button>
                    <button
                        onClick={onDelete}
                        style={{
                            border: '1px solid transparent',
                            background: 'transparent',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0.1rem 0.3rem',
                        }}
                        title="Delete"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Expanded subtask panel */}
            {expanded && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem 0.65rem 2.5rem',
                        border: '1px solid #d1d5db',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        background: '#f9fafb',
                        display: 'grid',
                        gap: '0.3rem',
                    }}
                >
                    {subtasks.map((s) => (
                        <div
                            key={s.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '16px 1fr auto',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.5rem',
                                borderRadius: 8,
                                background: 'white',
                                border: '1px solid #e5e7eb',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={s.done}
                                onChange={() => handleToggleSubtask(s.id)}
                                style={{ margin: 0, width: 16, height: 16, cursor: 'pointer', accentColor: '#2c454d' }}
                            />
                            <span style={{
                                fontSize: '0.9rem',
                                lineHeight: 1.3,
                                textDecoration: s.done ? 'line-through' : 'none',
                                color: s.done ? 'var(--muted)' : 'inherit',
                            }}>
                                {s.title}
                            </span>
                            <button
                                onClick={() => handleDeleteSubtask(s.id)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#d1d5db',
                                    fontSize: '0.75rem',
                                    padding: '0.1rem 0.25rem',
                                    lineHeight: 1,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* Add subtask input */}
                    {addingSubtask ? (
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.15rem' }}>
                            <input
                                ref={inputRef}
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddSubtask()
                                    if (e.key === 'Escape') { setAddingSubtask(false); setNewSubtaskTitle('') }
                                }}
                                placeholder="Subtask..."
                                style={{
                                    flex: 1,
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: 8,
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.88rem',
                                    fontFamily: 'inherit',
                                    background: 'white',
                                }}
                            />
                            <button
                                onClick={handleAddSubtask}
                                disabled={!newSubtaskTitle.trim()}
                                style={{
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#2c454d',
                                    color: 'white',
                                    cursor: newSubtaskTitle.trim() ? 'pointer' : 'default',
                                    opacity: newSubtaskTitle.trim() ? 1 : 0.5,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Add
                            </button>
                            <button
                                onClick={() => { setAddingSubtask(false); setNewSubtaskTitle('') }}
                                style={{
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: 8,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    color: 'var(--muted)',
                                }}
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => { setAddingSubtask(true); setTimeout(() => inputRef.current?.focus(), 0) }}
                            style={{
                                alignSelf: 'start',
                                padding: '0.3rem 0.5rem',
                                borderRadius: 8,
                                border: '1px dashed #d1d5db',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                color: 'var(--muted)',
                                marginTop: subtasks.length > 0 ? '0.15rem' : 0,
                            }}
                        >
                            + Add subtask
                        </button>
                    )}
                </div>
            )}
        </li>
    )
}