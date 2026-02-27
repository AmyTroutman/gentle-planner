import TodayTasks from './TodayTasks'
import WeeklyTasks from './WeeklyTasks'
import type { Task } from './tasks.types'
import MealsAside from '../meals/MealsAside'
import type { DailyMeals } from '../meals/meals.types'
import NotesSection from '../notes/NotesSection'
import styles from './TasksPage.module.css'

type Props = {
    weeklyTheme: string
    dailyAffirmation: string

    // Today tasks
    tasks: Task[]
    onAddTask: (title: string) => void
    onToggleTask: (id: string) => void
    onDeleteTask: (id: string) => void

    // Weekly tasks
    weeklyTasks: Task[]
    onAddWeeklyTask: (title: string) => void
    onToggleWeeklyTask: (id: string) => void
    onDeleteWeeklyTask: (id: string) => void

    // Meals
    meals: DailyMeals
    onSetMeal: (type: 'breakfast' | 'lunch' | 'dinner', text: string) => void
    onClearMeal: (type: 'breakfast' | 'lunch' | 'dinner') => void
    onAddSnack: (text: string) => void
    onDeleteSnack: (id: string) => void
    onAddDrink: (text: string) => void
    onDeleteDrink: (id: string) => void

    // Notes
    note: string
    onNoteChange: (value: string) => void

    // Weekly reset nudge
    showResetNudge: boolean

    // Nav
    onOpenJournal: () => void
    onOpenHistory: () => void
    onOpenWeeklyReset: () => void
    onOpenNotebooks: () => void
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

const navButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '0.6rem 0.5rem',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
}

export default function TasksPage({
    weeklyTheme,
    dailyAffirmation,

    tasks,
    onAddTask,
    onToggleTask,
    onDeleteTask,

    weeklyTasks,
    onAddWeeklyTask,
    onToggleWeeklyTask,
    onDeleteWeeklyTask,

    meals,
    onSetMeal,
    onClearMeal,
    onAddSnack,
    onDeleteSnack,
    onDeleteDrink,
    onAddDrink,

    note,
    onNoteChange,

    showResetNudge,

    onOpenJournal,
    onOpenHistory,
    onOpenWeeklyReset,
    onOpenNotebooks,
}: Props) {
    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            <header style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ color: 'var(--muted)' }}>
                    This week: <span style={{ fontStyle: 'italic' }}>{weeklyTheme}</span>
                </div>

                <div style={{ fontSize: '1.15rem', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--muted)' }}>Today: </span>
                    "{dailyAffirmation}"
                </div>

                {/* Nav buttons in a row */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={onOpenJournal} style={navButtonStyle}>Journal</button>
                    <button onClick={onOpenNotebooks} style={navButtonStyle}>Notebooks</button>
                    <button onClick={onOpenHistory} style={navButtonStyle}>History</button>
                    <button onClick={onOpenWeeklyReset} style={navButtonStyle}>Weekly Reset</button>
                </div>
            </header>

            {/* Sunday nudge banner */}
            {showResetNudge && (
                <div
                    style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 12,
                        border: '1px solid #e9d5a1',
                        background: '#fefce8',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                    }}
                >
                    <span style={{ fontSize: '0.95rem', lineHeight: 1.4 }}>
                        ✦ It's Sunday — a good day to do your weekly reset.
                    </span>
                    <button
                        onClick={onOpenWeeklyReset}
                        style={{
                            padding: '0.5rem 0.9rem',
                            borderRadius: 10,
                            border: '1px solid #d4a827',
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Let's do it
                    </button>
                </div>
            )}

            <div className={styles.tasksLayout}>
                {/* Main column */}
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    <Card title="Today">
                        <TodayTasks tasks={tasks} onAdd={onAddTask} onToggle={onToggleTask} onDelete={onDeleteTask} />
                    </Card>

                    <Card title="This Week">
                        <WeeklyTasks
                            tasks={weeklyTasks}
                            onAdd={onAddWeeklyTask}
                            onToggle={onToggleWeeklyTask}
                            onDelete={onDeleteWeeklyTask}
                        />
                    </Card>
                </div>

                {/* Aside */}
                <div style={{ display: 'grid', gap: '1.25rem', alignContent: 'start' }}>
                    <Card title="Notes">
                        <NotesSection note={note} onChange={onNoteChange} />
                    </Card>

                    <aside
                        style={{
                            padding: '1rem',
                            borderRadius: 14,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}
                    >
                        <MealsAside
                            meals={meals}
                            onSetMeal={onSetMeal}
                            onClearMeal={onClearMeal}
                            onAddSnack={onAddSnack}
                            onDeleteSnack={onDeleteSnack}
                            onAddDrink={onAddDrink}
                            onDeleteDrink={onDeleteDrink}
                        />
                    </aside>
                </div>
            </div>
        </section>
    )
}