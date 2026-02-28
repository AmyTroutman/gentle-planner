import { useState } from 'react'
import type { Task } from '../tasks/tasks.types'
import type { CalendarEntry } from '../calendar/calendar.types'
import { getDayId } from '../../lib/dates'

type Props = {
    // Yesterday's incomplete day tasks
    yesterdayTasks: Task[]
    yesterdayDayId: string

    // This week's open tasks
    weeklyTasks: Task[]

    // Today's tasks (for the sidebar view)
    todayTasks: Task[]

    // This month's open task-tagged calendar entries
    monthEntries: Array<{ entry: CalendarEntry; dayId: string }>

    // Actions for yesterday's tasks
    onKeepToday: (task: Task) => void
    onPushToWeek: (task: Task) => void
    onPushToMonth: (task: Task, dayId: string) => void

    // Actions for weekly tasks (moves to today AND removes from week)
    onPullWeekToDay: (task: Task) => void

    // Actions for monthly entries
    onPullEntryToDay: (entry: CalendarEntry, fromDayId: string) => void
    onPullEntryToWeek: (entry: CalendarEntry, fromDayId: string) => void

    onDone: () => void
    isStandalone?: boolean
}

type YesterdayDecision = 'today' | 'week' | 'month' | 'dismiss' | null
type PullState = 'idle' | 'day' | 'week'

export default function TaskReviewStep({
    yesterdayTasks,
    yesterdayDayId,
    weeklyTasks,
    todayTasks,
    monthEntries,
    onKeepToday,
    onPushToWeek,
    onPushToMonth,
    onPullWeekToDay,
    onPullEntryToDay,
    onPullEntryToWeek,
    onDone,
    isStandalone = false,
}: Props) {
    const [decisions, setDecisions] = useState<Record<string, YesterdayDecision>>({})
    // Track pull state for weekly tasks and month entries so we can show feedback
    const [weekPulled, setWeekPulled] = useState<Record<string, PullState>>({})
    const [entryPulled, setEntryPulled] = useState<Record<string, PullState>>({})

    const allYesterdayDecided = yesterdayTasks.every(t => decisions[t.id] != null)

    function setDecision(taskId: string, decision: YesterdayDecision) {
        setDecisions(prev => ({ ...prev, [taskId]: decision }))
    }

    function applyDecision(task: Task, decision: YesterdayDecision) {
        if (decision === 'today') onKeepToday(task)
        else if (decision === 'week') onPushToWeek(task)
        else if (decision === 'month') onPushToMonth(task, getDayId(new Date()))
        // 'dismiss' = do nothing
    }

    function handleComplete() {
        for (const task of yesterdayTasks) {
            const d = decisions[task.id]
            if (d) applyDecision(task, d)
        }
        onDone()
    }

    function handlePullWeekToDay(task: Task) {
        onPullWeekToDay(task)
        setWeekPulled(prev => ({ ...prev, [task.id]: 'day' }))
    }

    function handlePullEntryToDay(entry: CalendarEntry, fromDayId: string) {
        onPullEntryToDay(entry, fromDayId)
        setEntryPulled(prev => ({ ...prev, [entry.id]: 'day' }))
    }

    function handlePullEntryToWeek(entry: CalendarEntry, fromDayId: string) {
        onPullEntryToWeek(entry, fromDayId)
        setEntryPulled(prev => ({ ...prev, [entry.id]: 'week' }))
    }

    const decisionBtn = (taskId: string, value: YesterdayDecision, label: string, color: string) => {
        const selected = decisions[taskId] === value
        return (
            <button
                key={value}
                onClick={() => setDecision(taskId, value)}
                style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 8,
                    border: `1px solid ${selected ? color : '#d1d5db'}`,
                    background: selected ? color : 'white',
                    color: selected ? 'white' : 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: selected ? 600 : 400,
                    transition: 'all 0.1s',
                }}
            >
                {label}
            </button>
        )
    }

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
        padding: '0.7rem 0.9rem',
        borderRadius: 12,
        border: '1px solid #d1d5db',
        background: 'white',
        display: 'grid',
        gap: '0.5rem',
    }

    const openWeekTasks = weeklyTasks.filter(t => !t.done)
    const yesterdayLabel = new Date(`${yesterdayDayId}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    const pulledBadge = (dest: 'day' | 'week') => (
        <span style={{
            padding: '0.25rem 0.6rem',
            borderRadius: 8,
            background: '#d1fae5',
            border: '1px solid #10b981',
            color: '#065f46',
            fontSize: '0.78rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
        }}>
            ✓ Added to {dest === 'day' ? 'today' : 'this week'}
        </span>
    )

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>

            {/* ── Main review column ── */}
            <div style={{ display: 'grid', gap: '1.75rem' }}>
                <div>
                    <h2 style={{ margin: '0 0 0.25rem' }}>
                        {isStandalone ? 'Task Review' : 'Good morning ✦'}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--muted)' }}>
                        Let's sort out what's on your plate before the day begins.
                    </p>
                </div>

                {/* Section 1: Yesterday's incomplete tasks (required) */}
                {yesterdayTasks.length > 0 && (
                    <div>
                        <p style={sectionTitle}>From yesterday ({yesterdayLabel})</p>
                        <p style={sectionSubtitle}>What do you want to do with these?</p>
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            {yesterdayTasks.map(task => (
                                <div key={task.id} style={card}>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{task.title}</span>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {decisionBtn(task.id, 'today', '→ Today', '#2c454d')}
                                        {decisionBtn(task.id, 'week', '→ This Week', '#6366f1')}
                                        {decisionBtn(task.id, 'month', '→ Month', '#0ea5e9')}
                                        {decisionBtn(task.id, 'dismiss', 'Let it go', '#9ca3af')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 2: This week's open tasks */}
                {openWeekTasks.length > 0 && (
                    <div>
                        <p style={sectionTitle}>This week's tasks</p>
                        <p style={sectionSubtitle}>Pull any to today — it'll be removed from the weekly list.</p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {openWeekTasks.map(task => {
                                const pulled = weekPulled[task.id]
                                return (
                                    <div key={task.id} style={{
                                        ...card,
                                        gridTemplateColumns: '1fr auto',
                                        alignItems: 'center',
                                        background: pulled ? '#f0fdf4' : 'white',
                                        borderColor: pulled ? '#10b981' : '#d1d5db',
                                    }}>
                                        <span style={{
                                            fontSize: '0.93rem',
                                            color: pulled ? 'var(--muted)' : 'var(--text)',
                                        }}>
                                            {task.title}
                                        </span>
                                        {pulled ? pulledBadge('day') : (
                                            <button
                                                onClick={() => handlePullWeekToDay(task)}
                                                style={{
                                                    padding: '0.3rem 0.7rem',
                                                    borderRadius: 8,
                                                    border: '1px solid #2c454d',
                                                    background: 'white',
                                                    color: '#2c454d',
                                                    cursor: 'pointer',
                                                    fontSize: '0.82rem',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                → Today
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Section 3: Month calendar task entries */}
                {monthEntries.length > 0 && (
                    <div>
                        <p style={sectionTitle}>This month's planned tasks</p>
                        <p style={sectionSubtitle}>Pull any into your week or today.</p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {monthEntries.map(({ entry, dayId }) => {
                                const date = new Date(`${dayId}T12:00:00`)
                                const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                const pulled = entryPulled[entry.id]
                                return (
                                    <div key={entry.id} style={{
                                        ...card,
                                        gridTemplateColumns: '1fr auto',
                                        background: pulled ? '#f0fdf4' : 'white',
                                        borderColor: pulled ? '#10b981' : '#d1d5db',
                                    }}>
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{dateLabel} </span>
                                            <span style={{
                                                fontSize: '0.93rem',
                                                color: pulled ? 'var(--muted)' : 'var(--text)',
                                            }}>
                                                {entry.title}
                                            </span>
                                        </div>
                                        {pulled && pulled !== 'idle' ? pulledBadge(pulled) : (
                                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                <button
                                                    onClick={() => handlePullEntryToWeek(entry, dayId)}
                                                    style={{
                                                        padding: '0.3rem 0.55rem',
                                                        borderRadius: 8,
                                                        border: '1px solid #6366f1',
                                                        background: 'white',
                                                        color: '#6366f1',
                                                        cursor: 'pointer',
                                                        fontSize: '0.78rem',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    → Week
                                                </button>
                                                <button
                                                    onClick={() => handlePullEntryToDay(entry, dayId)}
                                                    style={{
                                                        padding: '0.3rem 0.55rem',
                                                        borderRadius: 8,
                                                        border: '1px solid #2c454d',
                                                        background: 'white',
                                                        color: '#2c454d',
                                                        cursor: 'pointer',
                                                        fontSize: '0.78rem',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    → Today
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {yesterdayTasks.length === 0 && openWeekTasks.length === 0 && monthEntries.length === 0 && (
                    <p style={{ color: 'var(--muted)', margin: 0 }}>You're all caught up — nothing to review!</p>
                )}

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <button
                        onClick={handleComplete}
                        disabled={yesterdayTasks.length > 0 && !allYesterdayDecided}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 12,
                            border: 'none',
                            background: (yesterdayTasks.length === 0 || allYesterdayDecided) ? '#2c454d' : '#d1d5db',
                            color: (yesterdayTasks.length === 0 || allYesterdayDecided) ? 'white' : '#9ca3af',
                            cursor: (yesterdayTasks.length === 0 || allYesterdayDecided) ? 'pointer' : 'default',
                            fontSize: '1rem',
                            fontWeight: 600,
                            justifySelf: 'start',
                        }}
                    >
                        {isStandalone ? 'Done' : 'Continue to today →'}
                    </button>
                    {yesterdayTasks.length > 0 && !allYesterdayDecided && (
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
                            Make a decision for each item from yesterday to continue.
                        </p>
                    )}
                </div>
            </div>

            {/* ── Today's tasks sidebar ── */}
            <div style={{
                position: 'sticky',
                top: '2rem',
                padding: '1rem',
                borderRadius: 14,
                border: '1px solid #d1d5db',
                background: 'white',
                display: 'grid',
                gap: '0.75rem',
            }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#2c454d' }}>
                    Today's tasks
                </h3>
                {todayTasks.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>Nothing yet.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
                        {todayTasks.map(t => (
                            <li key={t.id} style={{
                                fontSize: '0.88rem',
                                padding: '0.45rem 0.6rem',
                                borderRadius: 8,
                                border: '1px solid #e5e7eb',
                                background: '#f9fafb',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: '#2c454d', flexShrink: 0,
                                }} />
                                <span style={{
                                    textDecoration: t.done ? 'line-through' : 'none',
                                    color: t.done ? 'var(--muted)' : 'var(--text)',
                                }}>
                                    {t.title}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                    Tasks you pull in will appear here.
                </p>
            </div>

        </div>
    )
}