import { useMemo, useState } from 'react'
import { getDayId, getWeekId } from '../../lib/dates'
import type { Task } from '../tasks/tasks.types'
import type { DailyMeals } from '../meals/meals.types'
import type { WeekData } from '../morningFlow/morningFlow.types'
import type { ChatMessage } from '../journal/journal.types'
import type { CalendarEntry, CalendarTag, DayTracker, TrackerTag } from './calendar.types'
import TrackerAside from './TrackerAside'

// Only event and task are calendar entry tags now
const TAG_OPTIONS: CalendarTag[] = ['event', 'task']

const TAG_COLORS: Record<CalendarTag, { bg: string; border: string; text: string }> = {
    event: { bg: '#e0f2fe', border: '#0ea5e9', text: '#0369a1' },
    task: { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9' },
}

// Dot colors for calendar grid — entries + tracker data
const ENTRY_DOT_COLORS: Record<CalendarTag, string> = {
    event: '#0ea5e9',
    task: '#8b5cf6',
}

const TRACKER_DOT_COLORS: Record<TrackerTag, string> = {
    period: '#ec4899',
    weight: '#22c55e',
    anxiety: '#f97316',
    symptom: '#f59e0b',
}

type Props = {
    weeks: Record<string, WeekData>
    tasksByDay: Record<string, Task[]>
    mealsByDay: Record<string, DailyMeals>
    journalByDay: Record<string, string>
    chatsByDay: Record<string, ChatMessage[]>
    calendarEntriesByDay: Record<string, CalendarEntry[]>
    trackersByDay: Record<string, DayTracker>
    onAddEntry: (dayId: string, entry: CalendarEntry) => void
    onUpdateEntry: (dayId: string, entry: CalendarEntry) => void
    onDeleteEntry: (dayId: string, entryId: string) => void
    onTrackerChange: (dayId: string, tracker: DayTracker) => void
    onClose: () => void
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{
            padding: '1rem',
            borderRadius: 14,
            border: '1px solid #d1d5db',
            background: 'white',
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>{title}</h3>
            {children}
        </section>
    )
}

function TagPill({ tag, selected, onClick }: { tag: CalendarTag; selected: boolean; onClick: () => void }) {
    const c = TAG_COLORS[tag]
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.25rem 0.65rem',
                borderRadius: 20,
                border: `1px solid ${selected ? c.border : '#d1d5db'}`,
                background: selected ? c.bg : 'white',
                color: selected ? c.text : 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: selected ? 600 : 400,
            }}
        >
            {tag}
        </button>
    )
}

function EntryForm({
    initial,
    onSave,
    onCancel,
}: {
    initial?: Partial<CalendarEntry>
    onSave: (entry: Omit<CalendarEntry, 'id' | 'createdAt'>) => void
    onCancel: () => void
}) {
    const [title, setTitle] = useState(initial?.title ?? '')
    const [tags, setTags] = useState<CalendarTag[]>(initial?.tags ?? [])
    const [notes, setNotes] = useState(initial?.notes ?? '')

    function toggleTag(tag: CalendarTag) {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
    }

    function submit() {
        if (!title.trim()) return
        onSave({ title: title.trim(), tags, notes: notes.trim() || undefined, done: initial?.done ?? false, movedTo: initial?.movedTo })
    }

    return (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                placeholder="Entry title…"
                style={{ padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid #d1d5db', fontSize: '0.95rem', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {TAG_OPTIONS.map(tag => (
                    <TagPill key={tag} tag={tag} selected={tags.includes(tag)} onClick={() => toggleTag(tag)} />
                ))}
            </div>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)…"
                rows={2}
                style={{ padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={submit}
                    disabled={!title.trim()}
                    style={{
                        padding: '0.55rem 1.1rem', borderRadius: 10, border: '1px solid #2c454d',
                        background: '#2c454d', color: 'white',
                        cursor: title.trim() ? 'pointer' : 'default', opacity: title.trim() ? 1 : 0.5, fontSize: '0.9rem',
                    }}
                >Save</button>
                <button
                    onClick={onCancel}
                    style={{ padding: '0.55rem 1.1rem', borderRadius: 10, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                >Cancel</button>
            </div>
        </div>
    )
}

export default function CalendarPage({
    weeks,
    tasksByDay,
    mealsByDay,
    journalByDay,
    chatsByDay,
    calendarEntriesByDay,
    trackersByDay,
    onAddEntry,
    onUpdateEntry,
    onDeleteEntry,
    onTrackerChange,
    onClose,
}: Props) {
    const todayId = getDayId(new Date())
    const [selectedDayId, setSelectedDayId] = useState(todayId)
    const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
    const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
    const [activeTagFilter, setActiveTagFilter] = useState<CalendarTag | null>(null)
    const [addingEntry, setAddingEntry] = useState(false)
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

    const monthDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1)
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
        const startDow = firstDay.getDay()
        const days: (string | null)[] = []
        for (let i = 0; i < startDow; i++) days.push(null)
        for (let d = 1; d <= daysInMonth; d++) {
            days.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
        }
        return days
    }, [viewYear, viewMonth])

    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }
    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }

    const selectedEntries = calendarEntriesByDay[selectedDayId] ?? []
    const isPast = selectedDayId < todayId
    const isFuture = selectedDayId > todayId

    // History data for selected day
    const weekId = useMemo(() => getWeekId(new Date(`${selectedDayId}T12:00:00`)), [selectedDayId])
    const week = weeks[weekId]
    const dayTasks = tasksByDay[selectedDayId] ?? []
    const meals = mealsByDay[selectedDayId]
    const journal = journalByDay[selectedDayId]
    const chat: ChatMessage[] = chatsByDay[selectedDayId] ?? []
    const dayReflections = (week?.reflections ?? []).filter(r => r.dayId === selectedDayId)

    const selectedTracker: DayTracker = trackersByDay[selectedDayId] ?? { period: false, symptoms: [], medications: false }

    function getDotsForDay(dayId: string): string[] {
        const dots: string[] = []
        // Dots from calendar entries
        const entries = calendarEntriesByDay[dayId] ?? []
        const entryTags = new Set<CalendarTag>()
        for (const e of entries) for (const t of e.tags) entryTags.add(t)
        for (const tag of entryTags) dots.push(ENTRY_DOT_COLORS[tag])

        // Dots from tracker data
        const tracker = trackersByDay[dayId]
        if (tracker) {
            if (tracker.period) dots.push(TRACKER_DOT_COLORS.period)
            if (tracker.weight != null) dots.push(TRACKER_DOT_COLORS.weight)
            if (tracker.anxiety != null) dots.push(TRACKER_DOT_COLORS.anxiety)
            if (tracker.symptoms?.length > 0) dots.push(TRACKER_DOT_COLORS.symptom)
        }
        return dots
    }

    function handleAddEntry(data: Omit<CalendarEntry, 'id' | 'createdAt'>) {
        const entry: CalendarEntry = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
        onAddEntry(selectedDayId, entry)
        setAddingEntry(false)
    }

    function handleUpdateEntry(id: string, data: Omit<CalendarEntry, 'id' | 'createdAt'>) {
        const existing = selectedEntries.find(e => e.id === id)
        if (!existing) return
        onUpdateEntry(selectedDayId, { ...existing, ...data })
        setEditingEntryId(null)
    }

    function toggleEntryDone(entry: CalendarEntry) {
        onUpdateEntry(selectedDayId, { ...entry, done: !entry.done })
    }

    const selectedDate = new Date(`${selectedDayId}T12:00:00`)
    const selectedDateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    const hasMeals = meals && (meals.breakfast || meals.lunch || meals.dinner || meals.snacks?.length || meals.drinks?.length)
    const openDayTasks = dayTasks.filter(t => !t.done)
    const doneDayTasks = dayTasks.filter(t => t.done)

    return (
        <section style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Calendar</h2>
                <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>
                    ← Back
                </button>
            </header>

            {/* Month grid */}
            <Card title="">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}>‹</button>
                    <strong style={{ fontSize: '1rem' }}>{monthLabel}</strong>
                    <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}>›</button>
                </div>

                {/* Tag filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTagFilter(null)}
                        style={{
                            padding: '0.2rem 0.6rem', borderRadius: 20,
                            border: `1px solid ${activeTagFilter === null ? '#2c454d' : '#d1d5db'}`,
                            background: activeTagFilter === null ? '#2c454d' : 'white',
                            color: activeTagFilter === null ? 'white' : 'var(--muted)',
                            cursor: 'pointer', fontSize: '0.78rem',
                        }}
                    >All</button>
                    {TAG_OPTIONS.map(tag => {
                        const c = TAG_COLORS[tag]
                        const active = activeTagFilter === tag
                        return (
                            <button key={tag} onClick={() => setActiveTagFilter(active ? null : tag)} style={{
                                padding: '0.2rem 0.6rem', borderRadius: 20,
                                border: `1px solid ${active ? c.border : '#d1d5db'}`,
                                background: active ? c.bg : 'white',
                                color: active ? c.text : 'var(--muted)',
                                cursor: 'pointer', fontSize: '0.78rem', fontWeight: active ? 600 : 400,
                            }}>{tag}</button>
                        )
                    })}
                </div>

                {/* Day-of-week headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '2px' }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', padding: '0.2rem 0' }}>{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                    {monthDays.map((dayId, i) => {
                        if (!dayId) return <div key={`empty-${i}`} />
                        const dots = getDotsForDay(dayId)
                        const isSelected = dayId === selectedDayId
                        const isToday = dayId === todayId
                        const dayNum = parseInt(dayId.split('-')[2])
                        return (
                            <button
                                key={dayId}
                                onClick={() => setSelectedDayId(dayId)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    padding: '0.3rem 0.2rem', borderRadius: 8,
                                    border: isSelected ? '2px solid #2c454d' : isToday ? '1px solid #9ca3af' : '1px solid transparent',
                                    background: isSelected ? '#2c454d' : 'transparent',
                                    color: isSelected ? 'white' : isToday ? '#2c454d' : 'var(--text)',
                                    cursor: 'pointer', fontSize: '0.88rem',
                                    fontWeight: isToday || isSelected ? 700 : 400,
                                    minHeight: 40, gap: '0.2rem',
                                }}
                            >
                                <span>{dayNum}</span>
                                {dots.length > 0 && (
                                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {dots.slice(0, 4).map((color, i) => (
                                            <span key={i} style={{
                                                width: 5, height: 5, borderRadius: '50%',
                                                background: isSelected ? 'rgba(255,255,255,0.8)' : color,
                                                flexShrink: 0,
                                            }} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </Card>

            {/* ── Day detail panel ── */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>{selectedDateLabel}</h3>
                        {isFuture && <span style={{ fontSize: '0.82rem', color: '#0ea5e9', fontWeight: 600 }}>Future date</span>}
                        {isPast && <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Past date</span>}
                    </div>
                    {!addingEntry && (
                        <button
                            onClick={() => setAddingEntry(true)}
                            style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #2c454d', background: '#2c454d', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                        >+ Add entry</button>
                    )}
                </div>

                {addingEntry && (
                    <div style={{ padding: '1rem', borderRadius: 14, border: '1px solid #d1d5db', background: 'white' }}>
                        <EntryForm onSave={handleAddEntry} onCancel={() => setAddingEntry(false)} />
                    </div>
                )}

                {/* Calendar entries */}
                {selectedEntries.length > 0 && (
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                        {selectedEntries.map(entry => (
                            <div key={entry.id} style={{ padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid #d1d5db', background: entry.done ? '#f9fafb' : 'white' }}>
                                {editingEntryId === entry.id ? (
                                    <EntryForm
                                        initial={entry}
                                        onSave={(data) => handleUpdateEntry(entry.id, data)}
                                        onCancel={() => setEditingEntryId(null)}
                                    />
                                ) : (
                                    <div style={{ display: 'grid', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                                {entry.tags.includes('task') && (
                                                    <input type="checkbox" checked={entry.done} onChange={() => toggleEntryDone(entry)} style={{ margin: 0, width: 16, height: 16, flexShrink: 0 }} />
                                                )}
                                                <span style={{ fontSize: '0.95rem', fontWeight: 500, textDecoration: entry.done ? 'line-through' : 'none', color: entry.done ? 'var(--muted)' : 'var(--text)' }}>
                                                    {entry.title}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                                <button onClick={() => setEditingEntryId(entry.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem' }}>Edit</button>
                                                <button onClick={() => onDeleteEntry(selectedDayId, entry.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem' }}>Delete</button>
                                            </div>
                                        </div>
                                        {entry.tags.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                {entry.tags.map(tag => {
                                                    const c = TAG_COLORS[tag] ?? { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' }
                                                    return (
                                                        <span key={tag} style={{ padding: '0.15rem 0.5rem', borderRadius: 20, background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: '0.75rem', fontWeight: 600 }}>
                                                            {tag}
                                                        </span>
                                                    )
                                                })}
                                                {entry.movedTo && (
                                                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 20, background: '#d1fae5', border: '1px solid #10b981', color: '#065f46', fontSize: '0.75rem', fontWeight: 600 }}>
                                                        → {entry.movedTo === 'day' ? 'Today' : 'This Week'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {entry.notes && <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{entry.notes}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {selectedEntries.length === 0 && !addingEntry && (
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>No calendar entries for this day.</p>
                )}

                {/* Tracker — editable for any day */}
                <div style={{ padding: '1rem', borderRadius: 14, border: '1px solid #d1d5db', background: 'white' }}>
                    <TrackerAside
                        tracker={selectedTracker}
                        onChange={(updated) => onTrackerChange(selectedDayId, updated)}
                    />
                </div>

                {/* ── History section — only shown for past dates that have data ── */}
                {!isFuture && (dayTasks.length > 0 || hasMeals || journal || dayReflections.length > 0 || chat.length > 0) && (
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            History
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Day tasks */}
                            {dayTasks.length > 0 && (
                                <Card title="Day tasks">
                                    {openDayTasks.length > 0 && (
                                        <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.25rem' }}>
                                            {openDayTasks.map(t => <li key={t.id} style={{ marginBottom: '0.2rem' }}>{t.title}</li>)}
                                        </ul>
                                    )}
                                    {doneDayTasks.length > 0 && (
                                        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)' }}>
                                            {doneDayTasks.map(t => <li key={t.id} style={{ textDecoration: 'line-through', marginBottom: '0.2rem' }}>{t.title}</li>)}
                                        </ul>
                                    )}
                                </Card>
                            )}

                            {/* Meals */}
                            {hasMeals && (
                                <Card title="Meals">
                                    <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}>
                                        {meals!.breakfast && <div><strong>Breakfast:</strong> {meals!.breakfast}</div>}
                                        {meals!.lunch && <div><strong>Lunch:</strong> {meals!.lunch}</div>}
                                        {meals!.dinner && <div><strong>Dinner:</strong> {meals!.dinner}</div>}
                                        {meals!.snacks?.length > 0 && <div><strong>Snacks:</strong> {meals!.snacks.map(s => s.text).join(', ')}</div>}
                                        {meals!.drinks?.length > 0 && <div><strong>Drinks:</strong> {meals!.drinks.map(d => d.text).join(', ')}</div>}
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Reflections */}
                        {dayReflections.length > 0 && (
                            <Card title="Reflections">
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {dayReflections.map(r => (
                                        <p key={r.id} style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            {r.text}
                                        </p>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Journal */}
                        {journal && (
                            <Card title="Journal">
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}>{journal}</p>
                            </Card>
                        )}

                        {/* Chat */}
                        {chat.length > 0 && (
                            <Card title="Chat">
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {chat.map((msg, i) => (
                                        <div key={i} style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 10,
                                            background: msg.role === 'user' ? '#f3f4f6' : '#f0fdf4',
                                            fontSize: '0.88rem',
                                            lineHeight: 1.5,
                                        }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>
                                                {msg.role === 'user' ? 'You' : 'Claude'}
                                            </span>
                                            {msg.content}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}