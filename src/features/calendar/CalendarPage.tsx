import { useMemo, useState } from 'react'
import { getDayId, getWeekId } from '../../lib/dates'
import type { Task } from '../tasks/tasks.types'
import type { DailyMeals } from '../meals/meals.types'
import type { WeekData } from '../morningFlow/morningFlow.types'
import type { ChatMessage } from '../journal/journal.types'
import type { CalendarEntry, CalendarTag, DayTracker, TrackerTag } from './calendar.types'
import { getTasksForDay, getMonthTasks, moveTaskToToday, moveTaskToWeek, addTask } from '../tasks/taskHelpers'
import TrackerAside from './TrackerAside'
import MealsAside from '../meals/MealsAside'

const TAG_OPTIONS: CalendarTag[] = ['event', 'game']

const TAG_COLORS: Record<CalendarTag, { bg: string; border: string; text: string }> = {
    event: { bg: '#e0f2fe', border: '#0ea5e9', text: '#0369a1' },
    game: { bg: '#e9feea', border: '#00653e', text: '#004833' },
}

// Dot colors for calendar grid — entries + tracker data
const ENTRY_DOT_COLORS: Record<CalendarTag, string> = {
    event: '#0ea5e9',
    game: '#00653e',
}

const TRACKER_DOT_COLORS: Record<TrackerTag, string> = {
    period: '#ec4899',
    weight: '#22c55e',
    anxiety: '#f97316',
    symptom: '#f59e0b',
}

type Props = {
    weeks: Record<string, WeekData>
    tasks: Record<string, Task>
    setTasks: (updater: Record<string, Task> | ((prev: Record<string, Task>) => Record<string, Task>)) => void
    mealsByDay: Record<string, DailyMeals>
    journalByDay: Record<string, string>
    chatsByDay: Record<string, ChatMessage[]>
    calendarEntriesByDay: Record<string, CalendarEntry[]>
    trackersByDay: Record<string, DayTracker>
    onAddEntry: (dayId: string, entry: CalendarEntry) => void
    onUpdateEntry: (dayId: string, entry: CalendarEntry) => void
    onDeleteEntry: (dayId: string, entryId: string) => void
    onTrackerChange: (dayId: string, tracker: DayTracker) => void
    onMealsChange: (dayId: string, meals: DailyMeals) => void
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
    tasks,
    setTasks,
    mealsByDay,
    journalByDay,
    chatsByDay,
    calendarEntriesByDay,
    trackersByDay,
    onAddEntry,
    onUpdateEntry,
    onDeleteEntry,
    onTrackerChange,
    onMealsChange,
    onClose,
}: Props) {
    const todayId = getDayId(new Date())
    const currentWeekId = getWeekId(new Date())
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
    const dayTasks = getTasksForDay(tasks, selectedDayId)
    const journal = journalByDay[selectedDayId]
    const chat: ChatMessage[] = chatsByDay[selectedDayId] ?? []
    const dayReflections = (week?.reflections ?? []).filter(r => r.dayId === selectedDayId)

    const selectedTracker: DayTracker = trackersByDay[selectedDayId] ?? { period: false, symptoms: [], medications: false }
    const selectedMeals: DailyMeals = mealsByDay[selectedDayId] ?? { snacks: [], drinks: [] }

    function setSingleMeal(type: 'breakfast' | 'lunch' | 'dinner', text: string) {
        const current = mealsByDay[selectedDayId] ?? { snacks: [], drinks: [] }
        onMealsChange(selectedDayId, { ...current, [type]: text })
    }

    function clearSingleMeal(type: 'breakfast' | 'lunch' | 'dinner') {
        const current = mealsByDay[selectedDayId] ?? { snacks: [], drinks: [] }
        const next = { ...current }
        delete (next as any)[type]
        onMealsChange(selectedDayId, next)
    }

    function addSnack(text: string) {
        const current = mealsByDay[selectedDayId] ?? { snacks: [], drinks: [] }
        const snack = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }
        onMealsChange(selectedDayId, { ...current, snacks: [snack, ...current.snacks] })
    }

    function deleteSnack(id: string) {
        const current = mealsByDay[selectedDayId] ?? { snacks: [], drinks: [] }
        onMealsChange(selectedDayId, { ...current, snacks: current.snacks.filter(s => s.id !== id) })
    }

    function addDrink(text: string) {
        const current = mealsByDay[selectedDayId] ?? { snacks: [], drinks: [] }
        const drink = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }
        onMealsChange(selectedDayId, { ...current, drinks: [drink, ...(current.drinks ?? [])] })
    }

    function deleteDrink(id: string) {
        const current = mealsByDay[selectedDayId] ?? { snacks: [], drinks: [] }
        onMealsChange(selectedDayId, { ...current, drinks: (current.drinks ?? []).filter(d => d.id !== id) })
    }

    // Month tasks section
    const allMonthTasks = getMonthTasks(tasks)
    const openMonthTasks = allMonthTasks.filter(t => !t.done)
    const viewMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`
    const datedMonthTasks = openMonthTasks.filter(t => t.dueDate?.startsWith(viewMonthPrefix))
    const undatedMonthTasks = openMonthTasks.filter(t => !t.dueDate)
    const [undatedOpen, setUndatedOpen] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const [mainTab, setMainTab] = useState<'day' | 'month'>('day')
    const [daySubTab, setDaySubTab] = useState<'events' | 'tasks' | 'meals' | 'trackers' | 'journal'>('events')
    const [monthSubTab, setMonthSubTab] = useState<'events' | 'tasks'>('events')
    const [eventsFilter, setEventsFilter] = useState<'upcoming' | 'past'>('upcoming')
    const [tasksFilter, setTasksFilter] = useState<'upcoming' | 'past'>('upcoming')
    const [addingTask, setAddingTask] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskDueDate, setNewTaskDueDate] = useState('')

    function submitNewTask() {
        const cleaned = newTaskTitle.trim()
        if (!cleaned) return
        setTasks(prev => addTask(prev, { scope: 'month', title: cleaned, dueDate: newTaskDueDate || undefined }))
        setNewTaskTitle('')
        setNewTaskDueDate('')
        setAddingTask(false)
    }

    function getDotsForDay(dayId: string): string[] {
        const dots: string[] = []
        const entries = calendarEntriesByDay[dayId] ?? []
        const entryTags = new Set<CalendarTag>()
        for (const e of entries) for (const t of e.tags) entryTags.add(t)
        for (const tag of entryTags) dots.push(ENTRY_DOT_COLORS[tag])

        // Dot for any month tasks with this dueDate
        const hasMonthTask = Object.values(tasks).some(t => t.scope === 'month' && t.dueDate === dayId && !t.done)
        if (hasMonthTask) dots.push('#8b5cf6')

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

    const selectedDate = new Date(`${selectedDayId}T12:00:00`)
    const selectedDateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const dayTabLabel = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const monthTabLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long' })
    const monthCalendarEntries = Object.entries(calendarEntriesByDay)
        .filter(([dayId, entries]) => dayId.startsWith(viewMonthPrefix) && entries.length > 0)
        .sort(([a], [b]) => a.localeCompare(b))

    const openDayTasks = dayTasks.filter(t => !t.done)
    const doneDayTasks = dayTasks.filter(t => t.done)

    const btnStyle = (color: string): React.CSSProperties => ({
        padding: '0.2rem 0.55rem',
        borderRadius: 8,
        border: `1px solid ${color}`,
        background: 'white',
        color,
        cursor: 'pointer',
        fontSize: '0.78rem',
        whiteSpace: 'nowrap',
    })

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

            {/* ── Tab panel ── */}
            <div className="folder-tab-layout">
                <div className="folder-tabs">
                    <button className={`folder-tab${mainTab === 'day' ? ' active' : ''}`} onClick={() => setMainTab('day')}>{dayTabLabel}</button>
                    <button className={`folder-tab${mainTab === 'month' ? ' active' : ''}`} onClick={() => setMainTab('month')}>{monthTabLabel}</button>
                </div>
                <div className="folder-panel">

                    {/* ── Day tab ── */}
                    {mainTab === 'day' && (
                        <div style={{ display: 'grid', gap: '1rem' }}>

                            {/* Date subheading */}
                            <div>
                                <h3 style={{ margin: 0 }}>{selectedDateLabel}</h3>
                                {isFuture && <span style={{ fontSize: '0.82rem', color: '#0ea5e9', fontWeight: 600 }}>Future date</span>}
                                {isPast && <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Past date</span>}
                            </div>

                            <div className="month-tab-layout">
                                <div className="month-side-tabs">
                                    <button className={`month-side-tab${daySubTab === 'events' ? ' active' : ''}`} onClick={() => setDaySubTab('events')}>Events</button>
                                    <button className={`month-side-tab${daySubTab === 'tasks' ? ' active' : ''}`} onClick={() => setDaySubTab('tasks')}>Tasks</button>
                                    <button className={`month-side-tab${daySubTab === 'meals' ? ' active' : ''}`} onClick={() => setDaySubTab('meals')}>Meals</button>
                                    <button className={`month-side-tab${daySubTab === 'trackers' ? ' active' : ''}`} onClick={() => setDaySubTab('trackers')}>Trackers</button>
                                    {(journal || chat.length > 0 || dayReflections.length > 0) && <button className={`month-side-tab${daySubTab === 'journal' ? ' active' : ''}`} onClick={() => setDaySubTab('journal')}>Journal</button>}
                                </div>
                                <div className="month-panel">

                                    {/* Events panel */}
                                    {daySubTab === 'events' && (
                                        <div style={{ display: 'grid', gap: '0.75rem' }}>
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
                                                                        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: entry.done ? 'var(--muted)' : 'var(--text)' }}>
                                                                            {entry.title}
                                                                        </span>
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
                                                <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>No events for this day.</p>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                {!addingEntry && (
                                                    <button
                                                        onClick={() => setAddingEntry(true)}
                                                        style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #2c454d', background: '#2c454d', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                                                    >+ Add event</button>
                                                )}
                                            </div>
                                            {addingEntry && (
                                                <div style={{ padding: '1rem', borderRadius: 14, border: '1px solid #d1d5db', background: 'white' }}>
                                                    <EntryForm onSave={handleAddEntry} onCancel={() => setAddingEntry(false)} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tasks panel */}
                                    {daySubTab === 'tasks' && (
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {dayTasks.length === 0 && (
                                                <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>No tasks for this day.</p>
                                            )}
                                            {openDayTasks.length > 0 && (
                                                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.25rem' }}>
                                                    {openDayTasks.map(t => <li key={t.id} style={{ fontSize: '0.9rem' }}>{t.title}</li>)}
                                                </ul>
                                            )}
                                            {doneDayTasks.length > 0 && (
                                                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)', display: 'grid', gap: '0.25rem' }}>
                                                    {doneDayTasks.map(t => <li key={t.id} style={{ textDecoration: 'line-through', fontSize: '0.9rem' }}>{t.title}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    {/* Meals panel */}
                                    {daySubTab === 'meals' && (
                                        <MealsAside
                                            meals={selectedMeals}
                                            onSetMeal={setSingleMeal}
                                            onClearMeal={clearSingleMeal}
                                            onAddSnack={addSnack}
                                            onDeleteSnack={deleteSnack}
                                            onAddDrink={addDrink}
                                            onDeleteDrink={deleteDrink}
                                        />
                                    )}

                                    {/* Trackers panel */}
                                    {daySubTab === 'trackers' && (
                                        <TrackerAside
                                            tracker={selectedTracker}
                                            onChange={(updated) => onTrackerChange(selectedDayId, updated)}
                                        />
                                    )}

                                    {/* Journal panel */}
                                    {daySubTab === 'journal' && (
                                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                                            {journal && (
                                                <div style={{ display: 'grid', gap: '0.4rem' }}>
                                                    <strong style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Journal</strong>
                                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' }}>{journal}</p>
                                                </div>
                                            )}
                                            {dayReflections.length > 0 && (
                                                <div style={{ display: 'grid', gap: '0.4rem' }}>
                                                    <strong style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reflections</strong>
                                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                        {dayReflections.map(r => (
                                                            <p key={r.id} style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.text}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {chat.length > 0 && (
                                                <div style={{ display: 'grid', gap: '0.4rem' }}>
                                                    <button
                                                        onClick={() => setChatOpen(o => !o)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                                                    >
                                                        <strong style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chat ({chat.length})</strong>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{chatOpen ? '▲' : '▼'}</span>
                                                    </button>
                                                    {chatOpen && (
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
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>

                        </div>
                    )}

                    {/* ── Month tab ── */}
                    {mainTab === 'month' && (
                        <div className="month-tab-layout">
                            <div className="month-side-tabs">
                                <button className={`month-side-tab${monthSubTab === 'events' ? ' active' : ''}`} onClick={() => setMonthSubTab('events')}>Events</button>
                                <button className={`month-side-tab${monthSubTab === 'tasks' ? ' active' : ''}`} onClick={() => setMonthSubTab('tasks')}>Tasks</button>
                            </div>
                            <div className="month-panel">

                                {/* Events panel */}
                                {monthSubTab === 'events' && (
                                    <div style={{ display: 'grid', gap: '1rem' }}>

                                        {/* Past / Upcoming toggle */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 20, padding: '2px', gap: '2px' }}>
                                                <button
                                                    onClick={() => setEventsFilter('upcoming')}
                                                    style={{
                                                        padding: '0.2rem 0.65rem',
                                                        borderRadius: 20,
                                                        border: 'none',
                                                        background: eventsFilter === 'upcoming' ? 'white' : 'transparent',
                                                        color: eventsFilter === 'upcoming' ? 'var(--text)' : 'var(--muted)',
                                                        fontWeight: eventsFilter === 'upcoming' ? 500 : 400,
                                                        fontSize: '0.82rem',
                                                        boxShadow: eventsFilter === 'upcoming' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                                    }}
                                                >Upcoming</button>
                                                <button
                                                    onClick={() => setEventsFilter('past')}
                                                    style={{
                                                        padding: '0.2rem 0.65rem',
                                                        borderRadius: 20,
                                                        border: 'none',
                                                        background: eventsFilter === 'past' ? 'white' : 'transparent',
                                                        color: eventsFilter === 'past' ? 'var(--text)' : 'var(--muted)',
                                                        fontWeight: eventsFilter === 'past' ? 500 : 400,
                                                        fontSize: '0.82rem',
                                                        boxShadow: eventsFilter === 'past' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                                    }}
                                                >Past</button>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                {!addingEntry && (
                                                    <button
                                                        onClick={() => setAddingEntry(true)}
                                                        style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #2c454d', background: '#2c454d', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                                                    >+ Add event</button>
                                                )}
                                            </div>
                                            {addingEntry && (
                                                <div style={{ padding: '1rem', borderRadius: 14, border: '1px solid #d1d5db', background: 'white' }}>
                                                    <EntryForm onSave={handleAddEntry} onCancel={() => setAddingEntry(false)} />
                                                </div>
                                            )}
                                        </div>


                                        {/* Events list */}
                                        {(() => {
                                            const filtered = monthCalendarEntries.filter(([dayId]) =>
                                                eventsFilter === 'upcoming' ? dayId >= todayId : dayId < todayId
                                            )
                                            if (filtered.length === 0) return <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>No {eventsFilter} events this month.</p>
                                            return (
                                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                    {filtered.map(([dayId, entries]) => {
                                                        const d = new Date(`${dayId}T12:00:00`)
                                                        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                                        return (
                                                            <div key={dayId}>
                                                                <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dayLabel}</p>
                                                                <div style={{ display: 'grid', gap: '0.4rem' }}>
                                                                    {entries.map(entry => {
                                                                        const c = entry.tags[0] ? TAG_COLORS[entry.tags[0]] : null
                                                                        return (
                                                                            <div
                                                                                key={entry.id}
                                                                                onClick={() => { setSelectedDayId(dayId); setMainTab('day') }}
                                                                                style={{
                                                                                    padding: '0.55rem 0.75rem',
                                                                                    borderRadius: 10,
                                                                                    border: `1px solid ${c ? c.border : '#d1d5db'}`,
                                                                                    background: c ? c.bg : 'white',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.9rem',
                                                                                    color: entry.done ? 'var(--muted)' : (c ? c.text : 'var(--text)'),
                                                                                    textDecoration: entry.done ? 'line-through' : 'none',
                                                                                }}
                                                                            >
                                                                                {entry.title}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })()}

                                    </div>
                                )}

                                {/* Tasks panel */}
                                {monthSubTab === 'tasks' && (
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 20, padding: '2px', gap: '2px' }}>
                                                <button
                                                    onClick={() => setTasksFilter('upcoming')}
                                                    style={{ padding: '0.2rem 0.65rem', borderRadius: 20, border: 'none', background: tasksFilter === 'upcoming' ? 'white' : 'transparent', color: tasksFilter === 'upcoming' ? 'var(--text)' : 'var(--muted)', fontWeight: tasksFilter === 'upcoming' ? 500 : 400, fontSize: '0.82rem', boxShadow: tasksFilter === 'upcoming' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
                                                >Upcoming</button>
                                                <button
                                                    onClick={() => setTasksFilter('past')}
                                                    style={{ padding: '0.2rem 0.65rem', borderRadius: 20, border: 'none', background: tasksFilter === 'past' ? 'white' : 'transparent', color: tasksFilter === 'past' ? 'var(--text)' : 'var(--muted)', fontWeight: tasksFilter === 'past' ? 500 : 400, fontSize: '0.82rem', boxShadow: tasksFilter === 'past' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
                                                >Past</button>
                                            </div>
                                            {!addingTask && tasksFilter === 'upcoming' && (
                                                <button
                                                    onClick={() => setAddingTask(true)}
                                                    style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #2c454d', background: '#2c454d', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                                                >+ Add task</button>
                                            )}
                                        </div>

                                        {addingTask && (
                                            <div style={{ padding: '1rem', borderRadius: 14, border: '1px solid #d1d5db', background: 'white', display: 'grid', gap: '0.75rem' }}>
                                                <input
                                                    autoFocus
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') submitNewTask() }}
                                                    placeholder="Task title…"
                                                    style={{ padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid #d1d5db', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                                />
                                                <input
                                                    type="date"
                                                    value={newTaskDueDate}
                                                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                                                    style={{ padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                                />
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={submitNewTask}
                                                        disabled={!newTaskTitle.trim()}
                                                        style={{ padding: '0.55rem 1.1rem', borderRadius: 10, border: '1px solid #2c454d', background: '#2c454d', color: 'white', cursor: newTaskTitle.trim() ? 'pointer' : 'default', opacity: newTaskTitle.trim() ? 1 : 0.5, fontSize: '0.9rem' }}
                                                    >Save</button>
                                                    <button
                                                        onClick={() => { setAddingTask(false); setNewTaskTitle(''); setNewTaskDueDate('') }}
                                                        style={{ padding: '0.55rem 1.1rem', borderRadius: 10, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                                                    >Cancel</button>
                                                </div>
                                            </div>
                                        )}

                                        {(() => {
                                            const filteredDated = datedMonthTasks.filter(t =>
                                                tasksFilter === 'upcoming' ? (t.dueDate ?? '') >= todayId : (t.dueDate ?? '') < todayId
                                            )
                                            const filteredUndated = tasksFilter === 'upcoming' ? undatedMonthTasks : []
                                            return (filteredDated.length > 0 || filteredUndated.length > 0) ? (
                                                <div style={{ padding: '1rem', borderRadius: 14, border: '1px solid #d1d5db', background: 'white' }}>
                                                    {filteredDated.length > 0 && (
                                                        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: filteredUndated.length > 0 ? '0.75rem' : 0 }}>
                                                            {filteredDated.map(task => (
                                                                <div key={task.id} style={{
                                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                                    padding: '0.5rem 0.65rem', borderRadius: 10,
                                                                    border: '1px solid #d1d5db', background: '#fafafa',
                                                                }}>
                                                                    <span style={{ flex: 1, fontSize: '0.9rem' }}>{task.title}</span>
                                                                    <input
                                                                        type="date"
                                                                        value={task.dueDate ?? ''}
                                                                        onChange={(e) => setTasks(prev => ({
                                                                            ...prev,
                                                                            [task.id]: { ...prev[task.id], dueDate: e.target.value || undefined },
                                                                        }))}
                                                                        style={{ padding: '0.2rem 0.4rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                                                                    />
                                                                    <button style={btnStyle('#2c454d')} onClick={() => setTasks(prev => moveTaskToToday(prev, task.id, todayId, currentWeekId))}>→ Today</button>
                                                                    <button style={btnStyle('#6366f1')} onClick={() => setTasks(prev => moveTaskToWeek(prev, task.id, currentWeekId))}>→ Week</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {filteredUndated.length > 0 && (
                                                        <div>
                                                            <button
                                                                onClick={() => setUndatedOpen(o => !o)}
                                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem', padding: 0, marginBottom: '0.5rem' }}
                                                            >
                                                                No date yet ({filteredUndated.length}) {undatedOpen ? '▲' : '▼'}
                                                            </button>
                                                            {undatedOpen && (
                                                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                                    {filteredUndated.map(task => (
                                                                        <div key={task.id} style={{
                                                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                                            padding: '0.5rem 0.65rem', borderRadius: 10,
                                                                            border: '1px solid #d1d5db', background: '#fafafa',
                                                                        }}>
                                                                            <span style={{ flex: 1, fontSize: '0.9rem' }}>{task.title}</span>
                                                                            <input
                                                                                type="date"
                                                                                value={task.dueDate ?? ''}
                                                                                onChange={(e) => setTasks(prev => ({
                                                                                    ...prev,
                                                                                    [task.id]: { ...prev[task.id], dueDate: e.target.value || undefined },
                                                                                }))}
                                                                                style={{ padding: '0.2rem 0.4rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                                                                            />
                                                                            <button style={btnStyle('#2c454d')} onClick={() => setTasks(prev => moveTaskToToday(prev, task.id, todayId, currentWeekId))}>→ Today</button>
                                                                            <button style={btnStyle('#6366f1')} onClick={() => setTasks(prev => moveTaskToWeek(prev, task.id, currentWeekId))}>→ Week</button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>No {tasksFilter} tasks for this month.</p>
                                            )
                                        })()}
                                    </div>
                                )}

                            </div>
                        </div>
                    )}


                </div>{/* folder-panel */}
            </div>{/* folder-tab-layout */}
        </section>
    )
}
