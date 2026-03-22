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
import type { DailyMeals } from '../meals/meals.types'
import type { ChatMessage } from '../journal/journal.types'
import type { DayTracker } from '../calendar/calendar.types'
import CalendarPage from '../calendar/CalendarPage'
import JournalPage from '../journal/JournalPage'
import WeeklyThemeSetupStep from './steps/WeeklyThemeSetupStep'
import WeeklyResetFlow from '../weeklyReset/WeeklyResetFlow'
import NotebooksSection from '../notebooks/NotebooksSection'
import TaskReviewStep from '../tasks/TaskReviewStep'
import { getYesterdayIncompleteTasks } from '../tasks/taskHelpers'

function getYesterdayDayId(): string {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return getDayId(d)
}

export default function MorningFlow() {

    const weekId = getWeekId()
    const dayId = getDayId()
    const yesterdayId = getYesterdayDayId()

    const {
        loading,
        weeks, setWeeks,
        mealsByDay, setMealsByDay,
        tasks, setTasks,
        notesByDay, setNotesByDay,
        journalByDay, setJournalByDay,
        chatsByDay, setChatsByDay,
        notebooks, setNotebooks,
        calendarEntriesByDay, setCalendarEntriesByDay,
        trackersByDay, setTrackersByDay,
    } = useUserDoc()

    const hasCompletedMorningFlow = Boolean(mealsByDay[dayId]?.breakfast)

    const isSunday = new Date().getDay() === 0

    // Yesterday's incomplete daily tasks — drives whether taskReview appears in flow
    const hasYesterdayTasks = getYesterdayIncompleteTasks(tasks, yesterdayId).length > 0

    const [step, setStep] = useState<MorningStep>('greeting')
    const [stepInitialized, setStepInitialized] = useState(false)
    const [flowHasTaskReview, setFlowHasTaskReview] = useState(false)

    useEffect(() => {
        if (loading || stepInitialized) return
        setFlowHasTaskReview(hasYesterdayTasks)
        if (hasCompletedMorningFlow) {
            setStep('tasks')
        } else {
            setStep('greeting')
        }
        setStepInitialized(true)
    }, [loading, stepInitialized, hasCompletedMorningFlow])

    const [showCalendar, setShowCalendar] = useState(false)
    const [showJournal, setShowJournal] = useState(false)
    const [showNotebooks, setShowNotebooks] = useState(false)
    const [isWeeklyResetOpen, setIsWeeklyResetOpen] = useState(false)
    const [showTaskReview, setShowTaskReview] = useState(false)

    const todaysMeals: DailyMeals = mealsByDay[dayId] ?? { snacks: [], drinks: [] }
    const todaysNote = notesByDay[dayId] ?? ''
    const todaysJournal = journalByDay[dayId] ?? ''
    const todaysChat: ChatMessage[] = chatsByDay[dayId] ?? []
    const todaysTracker: DayTracker = trackersByDay[dayId] ?? { period: false, symptoms: [], medications: false }

    const weeklyTheme = weeks[weekId]?.theme ?? ''
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
                    weeklyReset: { completed: false, lookback: {}, taskDecisions: {} },
                },
            }
        })
    }, [weekId, setWeeks, loading])

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

    function updateTracker(updated: DayTracker) {
        setTrackersByDay((prev) => ({ ...prev, [dayId]: updated }))
    }

    // ── Calendar entry mutations ──
    function addCalendarEntry(forDayId: string, entry: import('../calendar/calendar.types').CalendarEntry) {
        setCalendarEntriesByDay((prev) => ({
            ...prev,
            [forDayId]: [entry, ...(prev[forDayId] ?? [])],
        }))
    }

    function updateCalendarEntry(forDayId: string, entry: import('../calendar/calendar.types').CalendarEntry) {
        setCalendarEntriesByDay((prev) => ({
            ...prev,
            [forDayId]: (prev[forDayId] ?? []).map(e => e.id === entry.id ? entry : e),
        }))
    }

    function deleteCalendarEntry(forDayId: string, entryId: string) {
        setCalendarEntriesByDay((prev) => ({
            ...prev,
            [forDayId]: (prev[forDayId] ?? []).filter(e => e.id !== entryId),
        }))
    }

    function next() {
        const order: MorningStep[] = isSunday
            ? ['greeting', 'affirmation', 'breakfast', 'weeklyReset', 'transition', 'tasks']
            : [
                'greeting', 'theme', 'affirmation', 'breakfast',
                ...(flowHasTaskReview ? ['taskReview' as MorningStep] : []),
                'transition', 'tasks',
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

    if (loading) {
        return (
            <main style={{ padding: '3rem', maxWidth: 700 }}>
                <p style={{ color: 'var(--muted)' }}>Loading...</p>
            </main>
        )
    }

    const showTasksMain = step === 'tasks' && !showCalendar && !showJournal && !isWeeklyResetOpen && !showNotebooks && !showTaskReview

    return (
        <main style={{ padding: '3rem', maxWidth: 900 }}>
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

            {step === 'weeklyReset' && (
                <WeeklyResetFlow
                    weeks={weeks}
                    setWeeks={setWeeks}
                    onClose={() => {
                        const behavior = (weeks[weekId] as any)?.weeklyReset?.behavior?.trim()
                        if (behavior && !todaysReflection) {
                            const newReflection: Reflection = {
                                id: crypto.randomUUID(),
                                text: behavior,
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
                                        reflections: [newReflection, ...existing.reflections.filter(r => r.dayId !== dayId)],
                                    },
                                }
                            })
                        }
                        next()
                    }}
                    journalByDay={journalByDay}
                    chatsByDay={chatsByDay}
                    tasks={tasks}
                    setTasks={setTasks}
                    todayDayId={dayId}
                    yesterdayDayId={yesterdayId}
                />
            )}

            {/* Task review step — only appears in flow if yesterday had incomplete tasks */}
            {step === 'taskReview' && (
                <TaskReviewStep
                    tasks={tasks}
                    setTasks={setTasks}
                    yesterdayDayId={yesterdayId}
                    todayDayId={dayId}
                    weekId={weekId}
                    onDone={next}
                />
            )}

            {step === 'transition' && <TransitionStep onDone={next} />}

            {showTasksMain && (
                <TasksPage
                    weeklyTheme={weeklyTheme}
                    dailyAffirmation={dailyAffirmation}
                    tasks={tasks}
                    setTasks={setTasks}
                    dayId={dayId}
                    weekId={weekId}
                    meals={todaysMeals}
                    onSetMeal={setSingleMeal}
                    onClearMeal={clearSingleMeal}
                    onAddSnack={addSnack}
                    onDeleteSnack={deleteSnack}
                    onAddDrink={addDrink}
                    onDeleteDrink={deleteDrink}
                    note={todaysNote}
                    onNoteChange={updateNote}
                    tracker={todaysTracker}
                    onTrackerChange={updateTracker}
                    calendarEntriesByDay={calendarEntriesByDay}
                    onOpenJournal={() => setShowJournal(true)}
                    onOpenCalendar={() => setShowCalendar(true)}
                    onOpenWeeklyReset={() => setIsWeeklyResetOpen(true)}
                    onOpenNotebooks={() => setShowNotebooks(true)}
                    onOpenTaskReview={() => setShowTaskReview(true)}
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

            {step === 'tasks' && showCalendar && (
                <CalendarPage
                    weeks={weeks}
                    tasks={tasks}
                    setTasks={setTasks}
                    mealsByDay={mealsByDay}
                    journalByDay={journalByDay}
                    chatsByDay={chatsByDay}
                    calendarEntriesByDay={calendarEntriesByDay}
                    trackersByDay={trackersByDay}
                    onAddEntry={addCalendarEntry}
                    onUpdateEntry={updateCalendarEntry}
                    onDeleteEntry={deleteCalendarEntry}
                    onTrackerChange={(forDayId, updated) => setTrackersByDay(prev => ({ ...prev, [forDayId]: updated }))}
                    onMealsChange={(forDayId, updated) => setMealsByDay(prev => ({ ...prev, [forDayId]: updated }))}
                    onClose={() => setShowCalendar(false)}
                />
            )}

            {step === 'tasks' && isWeeklyResetOpen && (
                <WeeklyResetFlow
                    weeks={weeks}
                    setWeeks={setWeeks}
                    onClose={() => setIsWeeklyResetOpen(false)}
                    journalByDay={journalByDay}
                    chatsByDay={chatsByDay}
                    tasks={tasks}
                    setTasks={setTasks}
                    todayDayId={dayId}
                    yesterdayDayId={yesterdayId}
                />
            )}

            {step === 'tasks' && showNotebooks && (
                <NotebooksSection
                    notebooks={notebooks}
                    onUpdate={setNotebooks}
                    onClose={() => setShowNotebooks(false)}
                />
            )}

            {/* Standalone task review — accessible anytime from Tasks page */}
            {step === 'tasks' && showTaskReview && (
                <TaskReviewStep
                    tasks={tasks}
                    setTasks={setTasks}
                    yesterdayDayId={yesterdayId}
                    todayDayId={dayId}
                    weekId={weekId}
                    onDone={() => setShowTaskReview(false)}
                    isStandalone
                />
            )}
        </main>
    )
}
