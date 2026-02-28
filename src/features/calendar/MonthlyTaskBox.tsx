import type { CalendarEntry } from '../calendar/calendar.types'

type Props = {
    calendarEntriesByDay: Record<string, CalendarEntry[]>
    currentWeekId: string
    onPullToDay: (entry: CalendarEntry, dayId: string) => void
    onPullToWeek: (entry: CalendarEntry, weekId: string) => void
    todayDayId: string
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
    calendarEntriesByDay,
    currentWeekId,
    onPullToDay,
    onPullToWeek,
    todayDayId,
}: Props) {
    const monthDayIds = getDayIdsForCurrentMonth(todayDayId)

    // Collect all event entries + undone task entries for this month
    type EntryWithDay = { entry: CalendarEntry; dayId: string }
    const relevant: EntryWithDay[] = []

    for (const dayId of monthDayIds) {
        const entries = calendarEntriesByDay[dayId] ?? []
        for (const entry of entries) {
            const isEvent = entry.tags.includes('event')
            const isUnfinishedTask = entry.tags.includes('task') && !entry.done
            if (isEvent || isUnfinishedTask) {
                relevant.push({ entry, dayId })
            }
        }
    }

    // Sort by date
    relevant.sort((a, b) => a.dayId.localeCompare(b.dayId))

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
        task: '#8b5cf6',
    }

    return (
        <section style={{ display: 'grid', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>This Month</h3>

            {relevant.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>
                    No events or tasks this month.
                </p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                    {relevant.map(({ entry, dayId }) => {
                        const date = new Date(`${dayId}T12:00:00`)
                        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        const isEvent = entry.tags.includes('event')
                        const isTask = entry.tags.includes('task')

                        return (
                            <li
                                key={entry.id}
                                style={{
                                    display: 'grid',
                                    gap: '0.35rem',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: 12,
                                    border: '1px solid #d1d5db',
                                    background: entry.done ? '#f9fafb' : 'white',
                                    opacity: entry.done ? 0.6 : 1,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                                        <span style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--muted)',
                                            display: 'flex',
                                            gap: '0.4rem',
                                            alignItems: 'center',
                                        }}>
                                            {dateLabel}
                                            {isEvent && (
                                                <span style={{ color: tagColors.event, fontWeight: 600, fontSize: '0.75rem' }}>EVENT</span>
                                            )}
                                            {isTask && (
                                                <span style={{
                                                    color: entry.movedTo ? '#10b981' : tagColors.task,
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                }}>
                                                    {/* TODO: this doesn't change once it's set */}
                                                    {entry.movedTo === 'day' ? 'IN TODAY' : entry.movedTo === 'week' ? 'IN WEEK' : 'TASK'}
                                                </span>
                                            )}
                                        </span>
                                        <span style={{
                                            fontSize: '0.93rem',
                                            textDecoration: entry.done ? 'line-through' : 'none',
                                        }}>
                                            {entry.title}
                                        </span>
                                    </div>

                                    {/* Action buttons — only for tasks that aren't done */}
                                    {isTask && !entry.done && (
                                        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                                            <button
                                                style={btnStyle('#6366f1')}
                                                onClick={() => onPullToWeek(entry, currentWeekId)}
                                                title="Add to this week"
                                            >
                                                → Week
                                            </button>
                                            <button
                                                style={btnStyle('#2c454d')}
                                                onClick={() => onPullToDay(entry, todayDayId)}
                                                title="Add to today"
                                            >
                                                → Today
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}