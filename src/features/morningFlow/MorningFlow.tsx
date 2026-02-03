import { useState, useEffect } from 'react'
import type { MorningStep, Reflection, WeekData } from './morningFlow.types'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import GreetingStep from './steps/GreetingStep'
import ThemeStep from './steps/ThemeStep'
import { getDayId, getPreviousWeekId, getWeekId } from '../../lib/dates'
import AffirmationStep from './steps/AffirmationStep'
import { BASE_AFFIRMATIONS } from '../../lib/affirmations'
import BreakfastStep from './steps/BreakfastStep'
import TransitionStep from './steps/TransitionStep'
import TasksPage from '../tasks/TasksPage'
import type { Task } from '../tasks/tasks.types'
import type { DailyMeals } from '../meals/meals.types'

type WeeksMap = Record<string, WeekData>

export default function MorningFlow() {
    const [step, setStep] = useState<MorningStep>('greeting')

    const weekId = getWeekId()
    const dayId = getDayId()

    const [weeks, setWeeks] = useLocalStorage<WeeksMap>('gentlePlanner.weeks', {})

    const [mealsByDay, setMealsByDay] = useLocalStorage<Record<string, DailyMeals>>(
        'gentlePlanner.mealsByDay',
        {}
    )

    const todaysMeals: DailyMeals = mealsByDay[dayId] ?? { snacks: [], drinks: [] }
    
    const [tasksByDay, setTasksByDay] = useLocalStorage<Record<string, Task[]>>(
        'gentlePlanner.tasksByDay',
        {}
    )

    const todaysTasks = tasksByDay[dayId] ?? []

    const prevWeekId = getPreviousWeekId()
    const prevUnfinishedCount =
        (weeks[prevWeekId]?.weeklyTasks ?? []).filter((t) => !t.done).length

    const canCarryOverWeeklyTasks = prevUnfinishedCount > 0

    // For now: fallback theme if not set yet
    const weeklyTheme = weeks[weekId]?.theme ?? 'kind'
    const weeklyTasks = weeks[weekId]?.weeklyTasks ?? []
    const reflections = weeks[weekId]?.reflections ?? []

    useEffect(() => {
        if (!weeks[weekId]?.affirmationsByDay?.[dayId]) {
            const affirmation = pickAffirmation()
            setWeeks((prev) => {
                const existing = prev[weekId]
                return {
                    ...prev,
                    [weekId]: {
                        weekId,
                        theme: existing?.theme ?? weeklyTheme,
                        reflections: existing?.reflections ?? [],
                        affirmationsByDay: {
                            ...(existing?.affirmationsByDay ?? {}),
                            [dayId]: affirmation,
                        },
                    },
                }
            })
        }
    }, [weekId, dayId])

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
        setWeeks((prev) => {
            const existing = prev[weekId]
            const nextWeek: WeekData = {
                weekId,
                theme: existing?.theme ?? weeklyTheme,
                reflections: existing?.reflections ?? [],
                affirmationsByDay: {
                    ...(existing?.affirmationsByDay ?? {}),
                    [dayId]: affirmation,
                },
            }
            return { ...prev, [weekId]: nextWeek }
        })
    }

    const dailyAffirmation = getTodayAffirmation()

    function setWeekTheme(theme: string) {
        setWeeks((prev) => ({
            ...prev,
            [weekId]: {
                weekId,
                theme,
                reflections: prev[weekId]?.reflections ?? [],
            },
        }))
    }

    function addReflection(text: string) {
        const newItem: Reflection = {
            id: crypto.randomUUID(),
            text,
            createdAt: new Date().toISOString(),
        }

        setWeeks((prev) => {
            const existing = prev[weekId]
            const nextWeek: WeekData = {
                weekId,
                theme: existing?.theme ?? weeklyTheme,
                reflections: [newItem, ...(existing?.reflections ?? [])],
            }
            return { ...prev, [weekId]: nextWeek }
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

    function carryOverWeeklyTasks() {
        const prevWeekId = getPreviousWeekId()
        const prevWeek = weeks[prevWeekId]
        const currentWeek = weeks[weekId]

        const prevTasks = prevWeek?.weeklyTasks ?? []
        const unfinished = prevTasks.filter((t) => !t.done)

        if (unfinished.length === 0) return

        // Prevent duplicates by title (simple + good enough for MVP)
        const existingTitles = new Set(
            (currentWeek?.weeklyTasks ?? []).map((t) => t.title.trim().toLowerCase())
        )

        const toAdd = unfinished
            .filter((t) => !existingTitles.has(t.title.trim().toLowerCase()))
            .map((t) => ({
                ...t,
                id: crypto.randomUUID(),
                done: false,
                doneAt: undefined,
                createdAt: new Date().toISOString(),
            }))

        if (toAdd.length === 0) return

        setWeeks((prev) => {
            const existingCurrent = prev[weekId]
            return {
                ...prev,
                [weekId]: {
                    weekId,
                    theme: existingCurrent?.theme ?? weeklyTheme,
                    reflections: existingCurrent?.reflections ?? [],
                    affirmationsByDay: existingCurrent?.affirmationsByDay ?? {},
                    weeklyTasks: [...toAdd, ...(existingCurrent?.weeklyTasks ?? [])],
                },
            }
        })
    }

    return (
        <main style={{ padding: '3rem', maxWidth: 700 }}>
            {step === 'greeting' && <GreetingStep onDone={next} />}

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

            {step === 'tasks' && (
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
                    onCarryOverWeeklyTasks={carryOverWeeklyTasks}
                    canCarryOverWeeklyTasks={canCarryOverWeeklyTasks}
                    meals={todaysMeals}
                    onSetMeal={setSingleMeal}
                    onClearMeal={clearSingleMeal}
                    onAddSnack={addSnack}
                    onDeleteSnack={deleteSnack}
                    onAddDrink={addDrink}
                    onDeleteDrink={deleteDrink}
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
