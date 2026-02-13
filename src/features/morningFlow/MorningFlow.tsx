import { useState, useEffect } from 'react'
import type { MorningStep, Reflection, WeekData, WeeksMap } from './morningFlow.types'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import GreetingStep from './steps/GreetingStep'
import ThemeStep from './steps/ThemeStep'
import { getDayId, getWeekId } from '../../lib/dates'
import AffirmationStep from './steps/AffirmationStep'
import { BASE_AFFIRMATIONS } from '../../lib/affirmations'
import BreakfastStep from './steps/BreakfastStep'
import TransitionStep from './steps/TransitionStep'
import TasksPage from '../tasks/TasksPage'
import type { Task } from '../tasks/tasks.types'
import type { DailyMeals } from '../meals/meals.types'
import HistoryPage from '../history/HistoryPage'
import WeeklyThemeSetupStep from './steps/WeeklyThemeSetupStep'
import WeeklyResetFlow from '../weeklyReset/WeeklyResetFlow'

export default function MorningFlow() {

    const weekId = getWeekId()
    const dayId = getDayId()

    const [weeks, setWeeks] = useLocalStorage<WeeksMap>('gentlePlanner.weeks', {})
    const weekHasTheme = Boolean(weeks[weekId]?.theme?.trim())

    useEffect(() => {
        setWeeks((prev) => {
            if (prev[weekId]) return prev
            return {
                ...prev,
                [weekId]: {
                    weekId,
                    theme: '',
                    reflections: [],
                    affirmationsByDay: {},
                    weeklyTasks: [],
                    weeklyReset: {
                        completed: false,
                        lookback: {},
                        taskDecisions: {},
                    },
                },
            }
        })
    }, [weekId, setWeeks])

    const [mealsByDay, setMealsByDay] = useLocalStorage<Record<string, DailyMeals>>(
        'gentlePlanner.mealsByDay',
        {}
    )
    const hasCompletedMorningFlow = Boolean(mealsByDay[dayId]?.breakfast)

    const [step, setStep] = useState<MorningStep>(() => {
        if (!weekHasTheme) return 'weeklyThemeSetup'
        if (hasCompletedMorningFlow) return 'tasks'
        return 'greeting'
    })

    const [showHistory, setShowHistory] = useState(false)

    const todaysMeals: DailyMeals = mealsByDay[dayId] ?? { snacks: [], drinks: [] }
    
    const [tasksByDay, setTasksByDay] = useLocalStorage<Record<string, Task[]>>(
        'gentlePlanner.tasksByDay',
        {}
    )

    const todaysTasks = tasksByDay[dayId] ?? []

    // For now: fallback theme if not set yet
    const weeklyTheme = weeks[weekId]?.theme 
    const weeklyTasks = weeks[weekId]?.weeklyTasks ?? []
    const reflections = weeks[weekId]?.reflections ?? []

    const [isWeeklyResetOpen, setIsWeeklyResetOpen] = useState(false)

    useEffect(() => {
        if (!weekHasTheme && step !== 'weeklyThemeSetup') {
            setStep('weeklyThemeSetup')
        }
    }, [weekHasTheme, step])

    useEffect(() => {
        const week = weeks[weekId]
        if (!week) return

        if (!week.affirmationsByDay[dayId]) {
            const affirmation = pickAffirmation()

            setWeeks((prev) => {
                const existing = prev[weekId]
                if (!existing) return prev

                // double-check to avoid overwriting if it changed
                if (existing.affirmationsByDay[dayId]) return prev

                return {
                    ...prev,
                    [weekId]: {
                        ...existing,
                        affirmationsByDay: {
                            ...existing.affirmationsByDay,
                            [dayId]: affirmation,
                        },
                    },
                }
            })
        }
    }, [weekId, dayId, weeks, setWeeks])

    function pickAffirmation(): string {
        const index = Math.floor(Math.random() * BASE_AFFIRMATIONS.length)
        return BASE_AFFIRMATIONS[index]
    }

    function refreshAffirmation() {
        const nextOne = pickAffirmation()
        setTodayAffirmation(nextOne)
    }

    function getTodayAffirmation(): string {
        const existing = weeks[weekId]?.affirmationsByDay?.[dayId]
        if (existing) return existing

        return pickAffirmation()
    }

    function setTodayAffirmation(affirmation: string) {
        const cleaned = affirmation.trim()
        if (!cleaned) return

        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    affirmationsByDay: {
                        ...existing.affirmationsByDay,
                        [dayId]: cleaned,
                    },
                },
            }
        })
    }

    const dailyAffirmation = getTodayAffirmation()

    function setWeekTheme(theme: string) {
        const cleaned = theme.trim()
        if (!cleaned) return

        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    theme: cleaned,
                },
            }
        })
    }

    function addReflection(text: string) {
        const cleaned = text.trim()
        if (!cleaned) return

        const newItem: Reflection = {
            id: crypto.randomUUID(),
            text: cleaned,
            createdAt: new Date().toISOString(),
            dayId,
        }

        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    reflections: [newItem, ...existing.reflections],
                },
            }
        })
    }

    function deleteReflection(id: string) {
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            const nextWeek: WeekData = {
                ...existing,
                reflections: existing.reflections.filter((r) => r.id !== id),
            }

            return { ...prev, [weekId]: nextWeek }
        })
    }

    function next() {
        const order: MorningStep[] = [
            'greeting',
            'theme',
            'affirmation',
            'breakfast',
            'transition',
            'tasks'
        ]

        const currentIndex = order.indexOf(step)
        const nextStep = order[currentIndex + 1]
        if (nextStep) setStep(nextStep)
    }

    function setBreakfastAndDrink(payload: { breakfast: string; drink: 'caf' | 'decaf' | 'tea' | 'none' }) {
        setSingleMeal('breakfast', payload.breakfast)

        if (payload.drink !== 'none') {
            const label =
                payload.drink === 'caf'
                    ? 'Caf'
                    : payload.drink === 'decaf'
                        ? 'Decaf'
                        : 'Tea'

            addDrink(label)
        }

        next()
    }

    function setSingleMeal(type: 'breakfast' | 'lunch' | 'dinner', text: string) {
        const cleaned = text.trim()
        if (!cleaned) return

        setMealsByDay((prev) => {
            const current = prev[dayId] ?? { snacks: [], drinks: [] }
            return {
                ...prev,
                [dayId]: {
                    ...current,
                    [type]: cleaned,
                },
            }
        })
    }

    function clearSingleMeal(type: 'breakfast' | 'lunch' | 'dinner') {
        setMealsByDay((prev) => {
            const current = prev[dayId] ?? { snacks: [], drinks: [] }
            const next = { ...current }
            delete (next as any)[type]
            return { ...prev, [dayId]: next }
        })
    }

    function addSnack(text: string) {
        const cleaned = text.trim()
        if (!cleaned) return

        const snack = {
            id: crypto.randomUUID(),
            text: cleaned,
            createdAt: new Date().toISOString(),
        }

        setMealsByDay((prev) => ({
            ...prev,
            [dayId]: {
                ...(prev[dayId] ?? { snacks: [] }),
                snacks: [snack, ...(prev[dayId]?.snacks ?? [])],
            },
        }))
    }

    function deleteSnack(id: string) {
        setMealsByDay((prev) => {
            const current = prev[dayId] ?? { snacks: [] }
            return {
                ...prev,
                [dayId]: { ...current, snacks: current.snacks.filter((s) => s.id !== id) },
            }
        })
    }

    function addDrink(text: string) {
        const cleaned = text.trim()
        if (!cleaned) return

        const drink = {
            id: crypto.randomUUID(),
            text: cleaned,
            createdAt: new Date().toISOString(),
        }

        setMealsByDay((prev) => {
            const current = prev[dayId] ?? { snacks: [], drinks: [] }
            return {
                ...prev,
                [dayId]: {
                    ...current,
                    drinks: [drink, ...(current.drinks ?? [])],
                },
            }
        })
    }

    function deleteDrink(id: string) {
        setMealsByDay((prev) => {
            const current = prev[dayId] ?? { snacks: [], drinks: [] }
            return {
                ...prev,
                [dayId]: {
                    ...current,
                    drinks: (current.drinks ?? []).filter((d) => d.id !== id),
                },
            }
        })
    }

    function addTask(title: string) {
        const t: Task = {
            id: crypto.randomUUID(),
            title,
            done: false,
            createdAt: new Date().toISOString(),
        }

        setTasksByDay((prev) => ({
            ...prev,
            [dayId]: [t, ...(prev[dayId] ?? [])],
        }))
    }

    function toggleTask(id: string) {
        setTasksByDay((prev) => ({
            ...prev,
            [dayId]: (prev[dayId] ?? []).map((t) =>
                t.id === id
                    ? {
                        ...t,
                        done: !t.done,
                        doneAt: !t.done ? new Date().toISOString() : undefined,
                    }
                    : t
            ),
        }))
    }

    function deleteTask(id: string) {
        setTasksByDay((prev) => ({
            ...prev,
            [dayId]: (prev[dayId] ?? []).filter((t) => t.id !== id),
        }))
    }

    function addWeeklyTask(title: string) {
        const t: Task = {
            id: crypto.randomUUID(),
            title,
            done: false,
            createdAt: new Date().toISOString(),
        }

        setWeeks((prev) => {
            const existing = prev[weekId]
            return {
                ...prev,
                [weekId]: {
                    weekId,
                    theme: existing?.theme ?? weeklyTheme,
                    reflections: existing?.reflections ?? [],
                    affirmationsByDay: existing?.affirmationsByDay ?? {},
                    weeklyTasks: [t, ...(existing?.weeklyTasks ?? [])],
                },
            }
        })
    }

    function toggleWeeklyTask(id: string) {
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            const nextWeeklyTasks = (existing.weeklyTasks ?? []).map((t) =>
                t.id === id
                    ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined }
                    : t
            )

            return {
                ...prev,
                [weekId]: { ...existing, weeklyTasks: nextWeeklyTasks },
            }
        })
    }

    function deleteWeeklyTask(id: string) {
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    weeklyTasks: (existing.weeklyTasks ?? []).filter((t) => t.id !== id),
                },
            }
        })
    }

    return (
        <main style={{ padding: '3rem', maxWidth: 700 }}>
            {step === 'greeting' && <GreetingStep onDone={next} />}

            {step === 'weeklyThemeSetup' && (
                <WeeklyThemeSetupStep
                    onSave={(theme) => {
                        setWeekTheme(theme)
                        // after setting theme, go to greeting or theme/reflection step
                        setStep(hasCompletedMorningFlow ? 'tasks' : 'greeting')
                    }}
                    onSkip={() => setStep(hasCompletedMorningFlow ? 'tasks' : 'greeting')}
                />
            )}

            {step === 'theme' && (
                <ThemeStep
                    weeklyTheme={weeklyTheme}
                    reflections={reflections}
                    onAddReflection={addReflection}
                    onDeleteReflection={deleteReflection}
                    onContinue={next}
                />
            )}

            {step === 'affirmation' && (
                <AffirmationStep
                    dailyAffirmation={dailyAffirmation}
                    onConfirm={next}
                    onRefresh={refreshAffirmation}
                />
            )}

            {step === 'breakfast' && (
                <BreakfastStep
                    options={[
                        'pb banana granola',
                        'breakfast sandwich',
                        'kolaches',
                        'oatmeal',
                        'cinnamon toast',
                        'a banana',
                    ]}
                    onSubmit={setBreakfastAndDrink}
                />
            )}

            {step === 'transition' && <TransitionStep onDone={next} />}

            {step === 'tasks' && !showHistory && !isWeeklyResetOpen && (
                <>
                    <TasksPage
                        weeklyTheme={weeklyTheme}
                        dailyAffirmation={dailyAffirmation}
                        tasks={todaysTasks}
                        onAddTask={addTask}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                        weeklyTasks={weeklyTasks}
                        onAddWeeklyTask={addWeeklyTask}
                        onToggleWeeklyTask={toggleWeeklyTask}
                        onDeleteWeeklyTask={deleteWeeklyTask}
                        meals={todaysMeals}
                        onSetMeal={setSingleMeal}
                        onClearMeal={clearSingleMeal}
                        onAddSnack={addSnack}
                        onDeleteSnack={deleteSnack}
                        onAddDrink={addDrink}
                        onDeleteDrink={deleteDrink}
                        onOpenHistory={() => setShowHistory(true)}
                        onOpenWeeklyReset={() => setIsWeeklyResetOpen(true)}
                    />
                </>
            )}

            {step === 'tasks' && showHistory && (
                <HistoryPage
                    weeks={weeks}
                    tasksByDay={tasksByDay}
                    mealsByDay={mealsByDay}
                    onClose={() => setShowHistory(false)}
                />
            )}

            {step === 'tasks' && isWeeklyResetOpen && (
                <WeeklyResetFlow
                    weeks={weeks}
                    setWeeks={setWeeks}
                    onClose={() => setIsWeeklyResetOpen(false)}
                />
            )}

            {step !== 'greeting' &&
                step !== 'theme' &&
                step !== 'affirmation' &&
                step !== 'breakfast' &&
                step !== 'transition' &&
                step !== 'tasks' && (
                    <>
                        <h2>Current step: {step}</h2>
                        <button onClick={next}>Next</button>
                    </>
                )}
            
        </main>
    )
}
