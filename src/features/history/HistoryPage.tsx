import { useMemo, useState } from 'react'
import { getDayId, getWeekId } from '../../lib/dates'
import type { Task } from '../tasks/tasks.types'
import type { DailyMeals } from '../meals/meals.types'
import type { WeekData } from '../morningFlow/morningFlow.types'
import type { ChatMessage } from '../journal/journal.types'

type HistoryTab = 'day' | 'journal'

type Props = {
    weeks: Record<string, WeekData>
    tasksByDay: Record<string, Task[]>
    mealsByDay: Record<string, DailyMeals>
    notesByDay: Record<string, string>
    journalByDay: Record<string, string>
    chatsByDay: Record<string, ChatMessage[]>
    onClose: () => void
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section
            style={{
                padding: '1rem',
                borderRadius: 14,
                border: '1px solid #d1d5db',
                background: 'white',
            }}
        >
            <h3 style={{ marginTop: 0 }}>{title}</h3>
            {children}
        </section>
    )
}

export default function HistoryPage({
    weeks,
    tasksByDay,
    mealsByDay,
    notesByDay,
    journalByDay,
    chatsByDay,
    onClose,
}: Props) {
    const [selectedDayId, setSelectedDayId] = useState(() => getDayId(new Date()))
    const [activeTab, setActiveTab] = useState<HistoryTab>('day')

    const selectedDate = useMemo(() => new Date(`${selectedDayId}T12:00:00`), [selectedDayId])
    const weekId = useMemo(() => getWeekId(selectedDate), [selectedDate])

    const week = weeks[weekId]
    const dailyAffirmation = week?.affirmationsByDay?.[selectedDayId] ?? ''
    const weeklyTheme = week?.theme ?? '(no theme saved)'
    const reflections = week?.reflections ?? []
    const weeklyTasks = week?.weeklyTasks ?? []

    const dayTasks = tasksByDay[selectedDayId] ?? []
    const meals = mealsByDay[selectedDayId] ?? { snacks: [], drinks: [] }
    const note = notesByDay[selectedDayId] ?? ''
    const journal = journalByDay[selectedDayId] ?? ''
    const chat: ChatMessage[] = chatsByDay[selectedDayId] ?? []

    const todaysReflection = reflections
        .filter((r) => r.dayId === selectedDayId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.text ?? ''

    const openDayTasks = dayTasks.filter((t) => !t.done)
    const doneDayTasks = dayTasks.filter((t) => t.done)
    const openWeekly = weeklyTasks.filter((t) => !t.done)
    const doneWeekly = weeklyTasks.filter((t) => t.done)

    const tabs: { id: HistoryTab; label: string }[] = [
        { id: 'day', label: 'Day' },
        { id: 'journal', label: 'Journal' },
    ]

    const tabButtonStyle = (id: HistoryTab): React.CSSProperties => ({
        padding: '0.6rem 1.1rem',
        border: 'none',
        borderBottom: activeTab === id ? '2px solid #2c454d' : '2px solid transparent',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: activeTab === id ? 600 : 400,
        color: activeTab === id ? '#2c454d' : 'var(--muted)',
        marginBottom: '-1px',
    })

    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <h2 style={{ margin: 0 }}>History</h2>
                    <label style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                        Pick a day:{' '}
                        <input
                            type="date"
                            value={selectedDayId}
                            onChange={(e) => setSelectedDayId(e.target.value)}
                            style={{
                                padding: '0.4rem 0.5rem',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                marginLeft: '0.5rem',
                            }}
                        />
                    </label>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: 12,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        cursor: 'pointer',
                    }}
                >
                    Back to Today
                </button>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #d1d5db' }}>
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabButtonStyle(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Day tab */}
            {activeTab === 'day' && (
                <>
                    <Card title="Context">
                        <div style={{ display: 'grid', gap: '0.4rem' }}>
                            <div style={{ color: 'var(--muted)' }}>
                                Week theme: <span style={{ fontStyle: 'italic' }}>{weeklyTheme}</span>
                            </div>
                            {dailyAffirmation ? (
                                <div style={{ fontSize: '1.05rem', lineHeight: 1.4 }}>
                                    <span style={{ color: 'var(--muted)' }}>Affirmation: </span>"{dailyAffirmation}"
                                </div>
                            ) : (
                                <div style={{ color: 'var(--muted)' }}>No affirmation saved for this day.</div>
                            )}
                        </div>
                    </Card>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <Card title="Day tasks">
                            {dayTasks.length === 0 ? (
                                <p style={{ margin: 0, color: 'var(--muted)' }}>No tasks saved for this day.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {openDayTasks.length > 0 && (
                                        <div>
                                            <strong>Open</strong>
                                            <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem' }}>
                                                {openDayTasks.map((t) => <li key={t.id}>{t.title}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {doneDayTasks.length > 0 && (
                                        <div>
                                            <strong>Done</strong>
                                            <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem', color: 'var(--muted)' }}>
                                                {doneDayTasks.map((t) => (
                                                    <li key={t.id} style={{ textDecoration: 'line-through' }}>{t.title}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        <Card title="Meals">
                            <div style={{ display: 'grid', gap: '0.6rem' }}>
                                <div><strong>Breakfast:</strong> {meals.breakfast ?? <span style={{ color: 'var(--muted)' }}>—</span>}</div>
                                <div><strong>Lunch:</strong> {meals.lunch ?? <span style={{ color: 'var(--muted)' }}>—</span>}</div>
                                <div><strong>Dinner:</strong> {meals.dinner ?? <span style={{ color: 'var(--muted)' }}>—</span>}</div>
                                <div>
                                    <strong>Snacks:</strong>{' '}
                                    {meals.snacks.length ? (
                                        <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.25rem' }}>
                                            {meals.snacks.map((s) => <li key={s.id}>{s.text}</li>)}
                                        </ul>
                                    ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                                </div>
                                <div>
                                    <strong>Drinks:</strong>{' '}
                                    {meals.drinks.length ? (
                                        <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.25rem' }}>
                                            {meals.drinks.map((d) => <li key={d.id}>{d.text}</li>)}
                                        </ul>
                                    ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <Card title="Week tasks">
                            {weeklyTasks.length === 0 ? (
                                <p style={{ margin: 0, color: 'var(--muted)' }}>No weekly tasks for this week.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {openWeekly.length > 0 && (
                                        <div>
                                            <strong>Open</strong>
                                            <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem' }}>
                                                {openWeekly.map((t) => <li key={t.id}>{t.title}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {doneWeekly.length > 0 && (
                                        <div>
                                            <strong>Done</strong>
                                            <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem', color: 'var(--muted)' }}>
                                                {doneWeekly.map((t) => (
                                                    <li key={t.id} style={{ textDecoration: 'line-through' }}>{t.title}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        <Card title="Notes">
                            {note ? (
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{note}</p>
                            ) : (
                                <p style={{ margin: 0, color: 'var(--muted)' }}>No notes for this day.</p>
                            )}
                        </Card>
                    </div>
                </>
            )}

            {/* Journal tab */}
            {activeTab === 'journal' && (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    <Card title="Reflection">
                        {todaysReflection ? (
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{todaysReflection}</p>
                        ) : (
                            <p style={{ margin: 0, color: 'var(--muted)' }}>No reflection for this day.</p>
                        )}
                    </Card>

                    <Card title="Journal">
                        {journal ? (
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{journal}</p>
                        ) : (
                            <p style={{ margin: 0, color: 'var(--muted)' }}>No journal entry for this day.</p>
                        )}
                    </Card>

                    {chat.length > 0 && (
                        <Card title="Chat">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {chat.map((msg, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        }}
                                    >
                                        <div
                                            style={{
                                                maxWidth: '80%',
                                                padding: '0.65rem 0.9rem',
                                                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                                background: msg.role === 'user' ? '#2c454d' : '#f9fafb',
                                                color: msg.role === 'user' ? 'white' : 'inherit',
                                                border: msg.role === 'assistant' ? '1px solid #d1d5db' : 'none',
                                                fontSize: '0.9rem',
                                                lineHeight: 1.6,
                                                whiteSpace: 'pre-wrap',
                                            }}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </section>
    )
}