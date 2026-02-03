import TodayTasks from './TodayTasks'
import WeeklyTasks from './WeeklyTasks'
import type { Task } from './tasks.types'
import MealsAside from '../meals/MealsAside'
import type { DailyMeals } from '../meals/meals.types'

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
    onCarryOverWeeklyTasks: () => void
    canCarryOverWeeklyTasks: boolean

    // Meals
    meals: DailyMeals
    onSetMeal: (type: 'breakfast' | 'lunch' | 'dinner', text: string) => void
    onClearMeal: (type: 'breakfast' | 'lunch' | 'dinner') => void
    onAddSnack: (text: string) => void
    onDeleteSnack: (id: string) => void
    onAddDrink: (text: string) => void
    onDeleteDrink: (id: string) => void
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
    onCarryOverWeeklyTasks,
    canCarryOverWeeklyTasks,

    meals,
    onSetMeal,
    onClearMeal,
    onAddSnack,
    onDeleteSnack,
    onDeleteDrink,
    onAddDrink
}: Props) {
    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            <header style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ color: 'var(--muted)' }}>
                    This week: <span style={{ fontStyle: 'italic' }}>{weeklyTheme}</span>
                </div>

                <div style={{ fontSize: '1.15rem', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--muted)' }}>Today: </span>
                    “{dailyAffirmation}”
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
                {/* Main column */}
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    <Card title="Today">
                        <TodayTasks tasks={tasks} onAdd={onAddTask} onToggle={onToggleTask} onDelete={onDeleteTask} />
                    </Card>

                    <Card title="This Week">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                            <button
                                onClick={onCarryOverWeeklyTasks}
                                disabled={!canCarryOverWeeklyTasks}
                                style={{
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: 10,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    opacity: canCarryOverWeeklyTasks ? 1 : 0.5,
                                    fontSize: '0.9rem',
                                }}
                                title="Bring unfinished weekly tasks forward from last week"
                            >
                                Carry over
                            </button>
                        </div>

                        <WeeklyTasks
                            tasks={weeklyTasks}
                            onAdd={onAddWeeklyTask}
                            onToggle={onToggleWeeklyTask}
                            onDelete={onDeleteWeeklyTask}
                        />
                    </Card>
                </div>

                {/* Aside */}
                <aside
                    style={{
                        padding: '1rem',
                        borderRadius: 14,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        alignSelf: 'start',
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
        </section>
    )
}
