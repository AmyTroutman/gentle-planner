import { useState } from 'react'
import type { Task } from './tasks.types'
import {
    getYesterdayIncompleteTasks,
    getTasksForDay,
    getTasksForWeek,
    getMonthTasks,
    moveTaskToToday,
    moveTaskToWeek,
    moveTaskToMonth,
} from './taskHelpers'

export type TaskReviewProps = {
    tasks: Record<string, Task>
    setTasks: (updater: (prev: Record<string, Task>) => Record<string, Task>) => void
    yesterdayDayId: string
    todayDayId: string
    weekId: string
    onDone: () => void
    isStandalone?: boolean
}

type Props = TaskReviewProps

// Tracks what action was taken on a yesterday task — used only for visual feedback
type YesterdayAction = 'today' | 'week' | 'month' | 'dismissed'

export default function TaskReviewStep({
    tasks,
    setTasks,
    yesterdayDayId,
    todayDayId,
    weekId,
    onDone,
    isStandalone = false,
}: Props) {
    const yesterdayTasks = getYesterdayIncompleteTasks(tasks, yesterdayDayId)
    const todayTasks = getTasksForDay(tasks, todayDayId)
    const weeklyTasks = getTasksForWeek(tasks, weekId)
    const monthTasks = getMonthTasks(tasks).filter(t => !t.done)

    const openWeekTasks = weeklyTasks.filter(t => !t.done)

    // Local state only for yesterday tasks — needed for visual feedback since
    // yesterday's list is read-only (we don't remove from it on action)
    const [yesterdayActioned, setYesterdayActioned] = useState<Record<string, YesterdayAction>>({})

    const sectionTitle: React.CSSProperties = {
        fontSize: '1rem',
        fontWeight: 700,
        margin: '0 0 0.1rem',
        color: '#2c454d',
    }

    const sectionSubtitle: React.CSSProperties = {
        fontSize: '0.85rem',
        color: 'var(--muted)',
        margin: '0 0 0.75rem',
    }

    const card: React.CSSProperties = {
        padding: '0.65rem 0.9rem',
        borderRadius: 12,
        border: '1px solid #d1d5db',
        background: 'white',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
    }

    const yesterdayLabel = new Date(`${yesterdayDayId}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
    })

    const isEmpty =
        yesterdayTasks.length === 0 &&
        todayTasks.length === 0 &&
        openWeekTasks.length === 0 &&
        monthTasks.length === 0

    function subtaskHint(task: Task) {
        if (!task.subtasks || task.subtasks.length === 0) return null
        return (
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
                ({task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''})
            </span>
        )
    }

    // Yesterday handlers — fire action then record it for visual feedback
    function handleYesterdayToToday(task: Task) {
        setTasks(prev => moveTaskToToday(prev, task.id, todayDayId, weekId))
        setYesterdayActioned(prev => ({ ...prev, [task.id]: 'today' }))
    }
    function handleYesterdayToWeek(task: Task) {
        setTasks(prev => moveTaskToWeek(prev, task.id, weekId))
        setYesterdayActioned(prev => ({ ...prev, [task.id]: 'week' }))
    }
    function handleYesterdayToMonth(task: Task) {
        setTasks(prev => moveTaskToMonth(prev, task.id))
        setYesterdayActioned(prev => ({ ...prev, [task.id]: 'month' }))
    }
    function handleDismissYesterday(task: Task) {
        setYesterdayActioned(prev => ({ ...prev, [task.id]: 'dismissed' }))
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: '1.75rem' }}>
                <div>
                    <h2 style={{ margin: '0 0 0.25rem' }}>
                        {isStandalone ? 'Task Review' : 'Your tasks'}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--muted)' }}>
                        {isStandalone
                            ? 'Move tasks between lists, or let things go.'
                            : 'Carry forward what still matters, let go of what doesn\'t.'}
                    </p>
                </div>

                {/* Section 1: Yesterday's incomplete tasks */}
                {yesterdayTasks.length > 0 && (
                    <div>
                        <p style={sectionTitle}>From yesterday ({yesterdayLabel})</p>
                        <p style={sectionSubtitle}>Where should these go?</p>
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            {yesterdayTasks.map(task => {
                                const action = yesterdayActioned[task.id]
                                const isDismissed = action === 'dismissed'
                                return (
                                    <div key={task.id} style={{
                                        ...card,
                                        background: action ? (isDismissed ? '#f9fafb' : '#f0fdf4') : 'white',
                                        borderColor: action ? (isDismissed ? '#d1d5db' : '#10b981') : '#d1d5db',
                                        opacity: isDismissed ? 0.6 : 1,
                                    }}>
                                        <span style={{
                                            fontSize: '0.95rem',
                                            fontWeight: 500,
                                            flex: 1,
                                            paddingTop: '0.1rem',
                                            color: action ? 'var(--muted)' : 'var(--text)',
                                        }}>
                                            {task.title}{subtaskHint(task)}
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flexShrink: 0 }}>
                                            <button
                                                onClick={() => handleYesterdayToToday(task)}
                                                style={actionBtn('#2c454d', action === 'today')}
                                            >→ Today</button>
                                            <button
                                                onClick={() => handleYesterdayToWeek(task)}
                                                style={actionBtn('#6366f1', action === 'week')}
                                            >→ Week</button>
                                            <button
                                                onClick={() => handleYesterdayToMonth(task)}
                                                style={actionBtn('#0ea5e9', action === 'month')}
                                            >→ Month</button>
                                            <button
                                                onClick={() => handleDismissYesterday(task)}
                                                style={actionBtn('#9ca3af', action === 'dismissed')}
                                            >Let it go</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Section 2: Today's tasks */}
                {todayTasks.length > 0 && (
                    <div>
                        <p style={sectionTitle}>Today</p>
                        <p style={sectionSubtitle}>Move anything that doesn't belong today.</p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {todayTasks.map(task => (
                                <div key={task.id} style={{ ...card, opacity: task.done ? 0.5 : 1 }}>
                                    <span style={{
                                        fontSize: '0.9rem',
                                        flex: 1,
                                        paddingTop: '0.1rem',
                                        textDecoration: task.done ? 'line-through' : 'none',
                                    }}>
                                        {task.title}{subtaskHint(task)}
                                    </span>
                                    {!task.done && (
                                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                            <button onClick={() => setTasks(prev => moveTaskToWeek(prev, task.id, weekId))} style={actionBtn('#6366f1')}>→ Week</button>
                                            <button onClick={() => setTasks(prev => moveTaskToMonth(prev, task.id))} style={actionBtn('#0ea5e9')}>→ Month</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 3: This week's open tasks */}
                {openWeekTasks.length > 0 && (
                    <div>
                        <p style={sectionTitle}>This week</p>
                        <p style={sectionSubtitle}>Pull any to today, or push to month.</p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {openWeekTasks.map(task => (
                                <div key={task.id} style={card}>
                                    <span style={{ fontSize: '0.9rem', flex: 1, paddingTop: '0.1rem' }}>
                                        {task.title}{subtaskHint(task)}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                        <button onClick={() => setTasks(prev => moveTaskToToday(prev, task.id, todayDayId, weekId))} style={actionBtn('#2c454d')}>→ Today</button>
                                        <button onClick={() => setTasks(prev => moveTaskToMonth(prev, task.id))} style={actionBtn('#0ea5e9')}>→ Month</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 4: Month tasks */}
                {monthTasks.length > 0 && (
                    <div>
                        <p style={sectionTitle}>On the list this month</p>
                        <p style={sectionSubtitle}>Pull any to today or this week.</p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {monthTasks.map(task => {
                                const dueDateLabel = task.dueDate
                                    ? new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : null
                                return (
                                    <div key={task.id} style={card}>
                                        <span style={{ fontSize: '0.9rem', flex: 1, paddingTop: '0.1rem' }}>
                                            {task.title}
                                            {dueDateLabel && (
                                                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '0.4rem' }}>
                                                    {dueDateLabel}
                                                </span>
                                            )}
                                            {subtaskHint(task)}
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                            <button onClick={() => setTasks(prev => moveTaskToToday(prev, task.id, todayDayId, weekId))} style={actionBtn('#2c454d')}>→ Today</button>
                                            <button onClick={() => setTasks(prev => moveTaskToWeek(prev, task.id, weekId))} style={actionBtn('#6366f1')}>→ Week</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {isEmpty && (
                    <p style={{ color: 'var(--muted)', margin: 0 }}>You're all caught up — nothing to review!</p>
                )}

                <button
                    onClick={onDone}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: 12,
                        border: 'none',
                        background: '#2c454d',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 600,
                        justifySelf: 'start',
                    }}
                >
                    {isStandalone ? 'Done' : 'Continue to today →'}
                </button>
            </div>
        </div>
    )
}

function actionBtn(color: string, active = false): React.CSSProperties {
    return {
        padding: '0.3rem 0.65rem',
        borderRadius: 8,
        border: `1px solid ${color}`,
        background: active ? color : 'white',
        color: active ? 'white' : color,
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: active ? 600 : 400,
        whiteSpace: 'nowrap',
    }
}
