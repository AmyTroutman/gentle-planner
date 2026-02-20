import { useMemo, useState } from 'react'
import { getDayId, getWeekId } from '../../lib/dates'
import type { Task } from '../tasks/tasks.types'
import type { DailyMeals } from '../meals/meals.types'
import type { WeekData } from '../morningFlow/morningFlow.types'

type Props = {
    weeks: Record<string, WeekData>
    tasksByDay: Record<string, Task[]>
    mealsByDay: Record<string, DailyMeals>
    notesByDay: Record<string, string>
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

export default function HistoryPage({ weeks, tasksByDay, mealsByDay, notesByDay, onClose }: Props) {
    const [selectedDayId, setSelectedDayId] = useState(() => getDayId(new Date()))

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

    const openDayTasks = dayTasks.filter((t) => !t.done)
    const doneDayTasks = dayTasks.filter((t) => t.done)

    const openWeekly = weeklyTasks.filter((t) => !t.done)
    const doneWeekly = weeklyTasks.filter((t) => t.done)

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
                    }}
                >
                    Back to Today
                </button>
            </header>

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
                                        {openDayTasks.map((t) => (
                                            <li key={t.id}>{t.title}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {doneDayTasks.length > 0 && (
                                <div>
                                    <strong>Done</strong>
                                    <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem', color: 'var(--muted)' }}>
                                        {doneDayTasks.map((t) => (
                                            <li key={t.id} style={{ textDecoration: 'line-through' }}>
                                                {t.title}
                                            </li>
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
                                    {meals.snacks.map((s) => (
                                        <li key={s.id}>{s.text}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span style={{ color: 'var(--muted)' }}>—</span>
                            )}
                        </div>

                        <div>
                            <strong>Drinks:</strong>{' '}
                            {meals.drinks.length ? (
                                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.25rem' }}>
                                    {meals.drinks.map((d) => (
                                        <li key={d.id}>{d.text}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span style={{ color: 'var(--muted)' }}>—</span>
                            )}
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
                                        {openWeekly.map((t) => (
                                            <li key={t.id}>{t.title}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {doneWeekly.length > 0 && (
                                <div>
                                    <strong>Done</strong>
                                    <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem', color: 'var(--muted)' }}>
                                        {doneWeekly.map((t) => (
                                            <li key={t.id} style={{ textDecoration: 'line-through' }}>
                                                {t.title}
                                            </li>
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

            {reflections.filter((r) => r.dayId === selectedDayId).length > 0 && (
                <Card title="Reflections">
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {reflections
                            .filter((r) => r.dayId === selectedDayId)
                            .map((r) => (
                                <p key={r.id} style={{ margin: 0, lineHeight: 1.6 }}>{r.text}</p>
                            ))}
                    </div>
                </Card>
            )}
        </section>
    )
}