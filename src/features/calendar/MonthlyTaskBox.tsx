import type { Task } from '../tasks/tasks.types'
import type { CalendarEntry } from './calendar.types'
import { getMonthTasks, moveTaskToToday, moveTaskToWeek } from '../tasks/taskHelpers'

type Props = {
    tasks: Record<string, Task>
    setTasks: (updater: (prev: Record<string, Task>) => Record<string, Task>) => void
    calendarEntriesByDay: Record<string, CalendarEntry[]>
    dayId: string
    weekId: string
}

function getDayIdsForCurrentMonth(todayDayId: string): string[] {
    const [year, month] = todayDayId.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const days: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return days
}

export default function MonthlyTaskBox({
    tasks,
    setTasks,
    calendarEntriesByDay,
    dayId,
    weekId,
}: Props) {
    const monthDayIds = getDayIdsForCurrentMonth(dayId)

    // Upcoming events/games from calendar (no task entries anymore)
    type EntryWithDay = { entry: CalendarEntry; entryDayId: string }
    const upcomingEvents: EntryWithDay[] = []
    for (const d of monthDayIds) {
        if (d < dayId) continue
        const entries = calendarEntriesByDay[d] ?? []
        for (const entry of entries) {
            if (entry.tags.includes('event') || entry.tags.includes('game')) {
                upcomingEvents.push({ entry, entryDayId: d })
            }
        }
    }
    upcomingEvents.sort((a, b) => a.entryDayId.localeCompare(b.entryDayId))

    // Month-scope tasks, open only
    const currentMonth = dayId.slice(0, 7) // 'YYYY-MM'

    const monthTasks = getMonthTasks(tasks).filter(t =>
        !t.done &&
        (!t.dueDate || t.dueDate.startsWith(currentMonth))
    )

    const btnStyle = (accent: string): React.CSSProperties => ({
        padding: '0.2rem 0.55rem',
        borderRadius: 8,
        border: `1px solid ${accent}`,
        background: 'white',
        color: accent,
        cursor: 'pointer',
        fontSize: '0.78rem',
        whiteSpace: 'nowrap',
    })

    const tagColors: Record<string, string> = {
        event: '#0ea5e9',
        game: '#00653e',
    }

    const hasContent = upcomingEvents.length > 0 || monthTasks.length > 0

    return (
        <section style={{ display: 'grid', gap: '0.75rem' }}>
            {!hasContent ? (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>
                    No events or tasks this month.
                </p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                    {/* Events / games */}
                    {upcomingEvents.map(({ entry, entryDayId }) => {
                        const date = new Date(`${entryDayId}T12:00:00`)
                        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        return (
                            <li
                                key={entry.id}
                                style={{
                                    display: 'grid',
                                    gap: '0.35rem',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: 12,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{dateLabel}</span>
                                    {entry.tags.map(tag => (
                                        <span key={tag} style={{ color: tagColors[tag] ?? 'var(--muted)', fontWeight: 600, fontSize: '0.75rem' }}>
                                            {tag.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                                <span style={{ fontSize: '0.93rem' }}>{entry.title}</span>
                            </li>
                        )
                    })}

                    {/* Month tasks */}
                    {monthTasks.map(task => {
                        const dueDateLabel = task.dueDate
                            ? new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : null
                        return (
                            <li
                                key={task.id}
                                style={{
                                    display: 'grid',
                                    gap: '0.35rem',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: 12,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                                        <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
                                            {dueDateLabel ?? 'No date'}
                                            <span style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '0.75rem' }}>TASK</span>
                                        </span>
                                        <span style={{ fontSize: '0.93rem' }}>{task.title}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                                        <button
                                            style={btnStyle('#6366f1')}
                                            onClick={() => setTasks(prev => moveTaskToWeek(prev, task.id, weekId))}
                                            title="Add to this week"
                                        >
                                            → Week
                                        </button>
                                        <button
                                            style={btnStyle('#2c454d')}
                                            onClick={() => setTasks(prev => moveTaskToToday(prev, task.id, dayId, weekId))}
                                            title="Add to today"
                                        >
                                            → Today
                                        </button>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
