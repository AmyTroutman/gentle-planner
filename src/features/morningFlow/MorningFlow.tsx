import { useState, useEffect } from 'react'
import type { MorningStep, Reflection, WeekData } from './morningFlow.types'
import { useUserDoc } from '../../hooks/useUserDoc'
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
import type { ChatMessage } from '../journal/journal.types'
import HistoryPage from '../history/HistoryPage'
import JournalPage from '../journal/JournalPage'
import WeeklyThemeSetupStep from './steps/WeeklyThemeSetupStep'
import WeeklyResetFlow from '../weeklyReset/WeeklyResetFlow'
import NotebooksSection from '../notebooks/NotebooksSection'

export default function MorningFlow() {

    const weekId = getWeekId()
    const dayId = getDayId()

    const {
        loading,
        weeks, setWeeks,
        mealsByDay, setMealsByDay,
        tasksByDay, setTasksByDay,
        notesByDay, setNotesByDay,
        journalByDay, setJournalByDay,
        chatsByDay, setChatsByDay,
        notebooks, setNotebooks,
    } = useUserDoc()

    const weekHasTheme = Boolean(weeks[weekId]?.theme?.trim())
    const hasCompletedMorningFlow = Boolean(mealsByDay[dayId]?.breakfast)

    // Sunday nudge: show if today is Sunday and this week's reset isn't done
    const isSunday = new Date().getDay() === 0
    const weeklyResetDone = Boolean((weeks[weekId] as any)?.weeklyReset?.completed)
    const showResetNudge = isSunday && !weeklyResetDone

    const [step, setStep] = useState<MorningStep>('greeting')
    const [stepInitialized, setStepInitialized] = useState(false)

    useEffect(() => {
        if (loading || stepInitialized) return
        if (!weekHasTheme) {
            setStep('weeklyThemeSetup')
        } else if (hasCompletedMorningFlow) {
            setStep('tasks')
        } else {
            setStep('greeting')
        }
        setStepInitialized(true)
    }, [loading, stepInitialized, weekHasTheme, hasCompletedMorningFlow])

    const [showHistory, setShowHistory] = useState(false)
    const [showJournal, setShowJournal] = useState(false)
    const [showNotebooks, setShowNotebooks] = useState(false)
    const [isWeeklyResetOpen, setIsWeeklyResetOpen] = useState(false)

    const todaysMeals: DailyMeals = mealsByDay[dayId] ?? { snacks: [], drinks: [] }
    const todaysTasks = tasksByDay[dayId] ?? []
    const todaysNote = notesByDay[dayId] ?? ''
    const todaysJournal = journalByDay[dayId] ?? ''
    const todaysChat: ChatMessage[] = chatsByDay[dayId] ?? []

    const weeklyTheme = weeks[weekId]?.theme ?? ''
    const weeklyTasks = weeks[weekId]?.weeklyTasks ?? []
    const reflections = weeks[weekId]?.reflections ?? []

    const todaysReflection = reflections
        .filter((r) => r.dayId === dayId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.text ?? ''

    useEffect(() => {
        if (loading) return
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
                    weeklyReset: { completed: false, lookback: {}, taskDecisions: {} },
                },
            }
        })
    }, [weekId, setWeeks, loading])

    useEffect(() => {
        if (loading) return
        if (!weekHasTheme && stepInitialized && step !== 'weeklyThemeSetup') {
            setStep('weeklyThemeSetup')
        }
    }, [weekHasTheme, step, stepInitialized, loading])

    useEffect(() => {
        if (loading) return
        const week = weeks[weekId]
        if (!week) return

        if (!week.affirmationsByDay[dayId]) {
            const affirmation = pickAffirmation()
            setWeeks((prev) => {
                const existing = prev[weekId]
                if (!existing) return prev
                if (existing.affirmationsByDay[dayId]) return prev
                return {
                    ...prev,
                    [weekId]: {
                        ...existing,
                        affirmationsByDay: { ...existing.affirmationsByDay, [dayId]: affirmation },
                    },
                }
            })
        }
    }, [weekId, dayId, weeks, setWeeks, loading])

    function pickAffirmation(): string {
        return BASE_AFFIRMATIONS[Math.floor(Math.random() * BASE_AFFIRMATIONS.length)]
    }

    function refreshAffirmation() {
        setTodayAffirmation(pickAffirmation())
    }

    function getTodayAffirmation(): string {
        return weeks[weekId]?.affirmationsByDay?.[dayId] ?? pickAffirmation()
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
                    affirmationsByDay: { ...existing.affirmationsByDay, [dayId]: cleaned },
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
            return { ...prev, [weekId]: { ...existing, theme: cleaned } }
        })
    }

    function handleReflectionChange(text: string) {
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            const existingToday = existing.reflections.find((r) => r.dayId === dayId)
            const otherReflections = existing.reflections.filter((r) => r.dayId !== dayId)
            const todayReflection: Reflection = {
                id: existingToday?.id ?? crypto.randomUUID(),
                text,
                createdAt: new Date().toISOString(),
                dayId,
            }

            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    reflections: text.trim()
                        ? [todayReflection, ...otherReflections]
                        : otherReflections,
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
                [weekId]: { ...existing, reflections: [newItem, ...existing.reflections] },
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

    function handleJournalChange(text: string) {
        setJournalByDay((prev) => ({ ...prev, [dayId]: text }))
    }

    function handleChatChange(messages: ChatMessage[]) {
        setChatsByDay((prev) => ({ ...prev, [dayId]: messages }))
    }

    function updateNote(value: string) {
        setNotesByDay((prev) => ({ ...prev, [dayId]: value }))
    }

    function next() {
        const order: MorningStep[] = [
            'greeting', 'theme', 'affirmation', 'breakfast', 'transition', 'tasks',
        ]
        const currentIndex = order.indexOf(step)
        const nextStep = order[currentIndex + 1]
        if (nextStep) setStep(nextStep)
    }

    function setBreakfastAndDrink(payload: { breakfast: string; drink: 'caf' | 'decaf' | 'tea' | 'none' }) {
        setSingleMeal('breakfast', payload.breakfast)
        if (payload.drink !== 'none') {
            const label = payload.drink === 'caf' ? 'Caf' : payload.drink === 'decaf' ? 'Decaf' : 'Tea'
            addDrink(label)
        }
        next()
    }

    function setSingleMeal(type: 'breakfast' | 'lunch' | 'dinner', text: string) {
        const cleaned = text.trim()
        if (!cleaned) return
        setMealsByDay((prev) => {
            const current = prev[dayId] ?? { snacks: [], drinks: [] }
            return { ...prev, [dayId]: { ...current, [type]: cleaned } }
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
        const snack = { id: crypto.randomUUID(), text: cleaned, createdAt: new Date().toISOString() }
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
            return { ...prev, [dayId]: { ...current, snacks: current.snacks.filter((s) => s.id !== id) } }
        })
    }

    function addDrink(text: string) {
        const cleaned = text.trim()
        if (!cleaned) return
        const drink = { id: crypto.randomUUID(), text: cleaned, createdAt: new Date().toISOString() }
        setMealsByDay((prev) => {
            const current = prev[dayId] ?? { snacks: [], drinks: [] }
            return { ...prev, [dayId]: { ...current, drinks: [drink, ...(current.drinks ?? [])] } }
        })
    }

    function deleteDrink(id: string) {
        setMealsByDay((prev) => {
            const current = prev[dayId] ?? { snacks: [], drinks: [] }
            return {
                ...prev,
                [dayId]: { ...current, drinks: (current.drinks ?? []).filter((d) => d.id !== id) },
            }
        })
    }

    function addTask(title: string) {
        const t: Task = { id: crypto.randomUUID(), title, done: false, createdAt: new Date().toISOString() }
        setTasksByDay((prev) => ({ ...prev, [dayId]: [t, ...(prev[dayId] ?? [])] }))
    }

    function toggleTask(id: string) {
        setTasksByDay((prev) => ({
            ...prev,
            [dayId]: (prev[dayId] ?? []).map((t) =>
                t.id === id
                    ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined }
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
        const t: Task = { id: crypto.randomUUID(), title, done: false, createdAt: new Date().toISOString() }
        setWeeks((prev) => {
            const existing = prev[weekId]
            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    weeklyTasks: [t, ...(existing?.weeklyTasks ?? [])],
                },
            }
        })
    }

    function toggleWeeklyTask(id: string) {
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev
            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    weeklyTasks: (existing.weeklyTasks ?? []).map((t) =>
                        t.id === id
                            ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined }
                            : t
                    ),
                },
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

    if (loading) {
        return (
            <main style={{ padding: '3rem', maxWidth: 700 }}>
                <p style={{ color: 'var(--muted)' }}>Loading...</p>
            </main>
        )
    }

    const showTasksMain = step === 'tasks' && !showHistory && !showJournal && !isWeeklyResetOpen && !showNotebooks

    return (
        <main style={{ padding: '3rem', maxWidth: 700 }}>
            {step === 'greeting' && <GreetingStep onDone={next} />}

            {step === 'weeklyThemeSetup' && (
                <WeeklyThemeSetupStep
                    onSave={(theme) => {
                        setWeekTheme(theme)
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

            {showTasksMain && (
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
                    note={todaysNote}
                    onNoteChange={updateNote}
                    showResetNudge={showResetNudge}
                    onOpenJournal={() => setShowJournal(true)}
                    onOpenHistory={() => setShowHistory(true)}
                    onOpenWeeklyReset={() => setIsWeeklyResetOpen(true)}
                    onOpenNotebooks={() => setShowNotebooks(true)}
                />
            )}

            {step === 'tasks' && showJournal && (
                <JournalPage
                    reflection={todaysReflection}
                    weeklyTheme={weeklyTheme}
                    onReflectionChange={handleReflectionChange}
                    journal={todaysJournal}
                    onJournalChange={handleJournalChange}
                    messages={todaysChat}
                    onMessagesChange={handleChatChange}
                    onClose={() => setShowJournal(false)}
                />
            )}

            {step === 'tasks' && showHistory && (
                <HistoryPage
                    weeks={weeks}
                    tasksByDay={tasksByDay}
                    mealsByDay={mealsByDay}
                    notesByDay={notesByDay}
                    journalByDay={journalByDay}
                    chatsByDay={chatsByDay}
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

            {step === 'tasks' && showNotebooks && (
                <NotebooksSection
                    notebooks={notebooks}
                    onUpdate={setNotebooks}
                    onClose={() => setShowNotebooks(false)}
                />
            )}
        </main>
    )
}