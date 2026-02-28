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
import type { CalendarEntry, DayTracker } from '../calendar/calendar.types'
import CalendarPage from '../calendar/CalendarPage'
import JournalPage from '../journal/JournalPage'
import WeeklyThemeSetupStep from './steps/WeeklyThemeSetupStep'
import WeeklyResetFlow from '../weeklyReset/WeeklyResetFlow'
import NotebooksSection from '../notebooks/NotebooksSection'
import TaskReviewStep from '../tasks/TaskReviewStep'

function getYesterdayDayId(): string {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return getDayId(d)
}

function getDayIdsForCurrentMonth(todayDayId: string): string[] {
    const [year, month] = todayDayId.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const days: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return days
}

export default function MorningFlow() {

    const weekId = getWeekId()
    const dayId = getDayId()
    const yesterdayId = getYesterdayDayId()

    const {
        loading,
        weeks, setWeeks,
        mealsByDay, setMealsByDay,
        tasksByDay, setTasksByDay,
        notesByDay, setNotesByDay,
        journalByDay, setJournalByDay,
        chatsByDay, setChatsByDay,
        notebooks, setNotebooks,
        calendarEntriesByDay, setCalendarEntriesByDay,
        trackersByDay, setTrackersByDay,
    } = useUserDoc()

    const weekHasTheme = Boolean(weeks[weekId]?.theme?.trim())
    const hasCompletedMorningFlow = Boolean(mealsByDay[dayId]?.breakfast)

    // Sunday nudge: show if today is Sunday and this week's reset isn't done
    const isSunday = new Date().getDay() === 0
    const weeklyResetDone = Boolean((weeks[weekId] as any)?.weeklyReset?.completed)
    const showResetNudge = isSunday && !weeklyResetDone

    // Yesterday's incomplete daily tasks — drives whether taskReview appears in flow
    const yesterdayIncompleteTasks = (tasksByDay[yesterdayId] ?? []).filter(t => !t.done)
    const hasYesterdayTasks = yesterdayIncompleteTasks.length > 0

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

    const [showCalendar, setShowCalendar] = useState(false)
    const [showJournal, setShowJournal] = useState(false)
    const [showNotebooks, setShowNotebooks] = useState(false)
    const [isWeeklyResetOpen, setIsWeeklyResetOpen] = useState(false)
    const [showTaskReview, setShowTaskReview] = useState(false)

    const todaysMeals: DailyMeals = mealsByDay[dayId] ?? { snacks: [], drinks: [] }
    const todaysTasks = tasksByDay[dayId] ?? []
    const todaysNote = notesByDay[dayId] ?? ''
    const todaysJournal = journalByDay[dayId] ?? ''
    const todaysChat: ChatMessage[] = chatsByDay[dayId] ?? []
    const todaysTracker: DayTracker = trackersByDay[dayId] ?? { period: false, symptoms: [], medications: [] }

    const weeklyTheme = weeks[weekId]?.theme ?? ''
    const weeklyTasks = weeks[weekId]?.weeklyTasks ?? []
    const reflections = weeks[weekId]?.reflections ?? []

    const todaysReflection = reflections
        .filter((r) => r.dayId === dayId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.text ?? ''

    // Month task entries (for review step and monthly box)
    const monthDayIds = getDayIdsForCurrentMonth(dayId)
    const monthTaskEntries: Array<{ entry: CalendarEntry; dayId: string }> = []
    for (const d of monthDayIds) {
        for (const e of calendarEntriesByDay[d] ?? []) {
            if (e.tags.includes('task') && !e.done) {
                monthTaskEntries.push({ entry: e, dayId: d })
            }
        }
    }

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

    function updateTracker(updated: DayTracker) {
        setTrackersByDay((prev) => ({ ...prev, [dayId]: updated }))
    }

    // ── Calendar entry mutations ──
    function addCalendarEntry(forDayId: string, entry: CalendarEntry) {
        setCalendarEntriesByDay((prev) => ({
            ...prev,
            [forDayId]: [entry, ...(prev[forDayId] ?? [])],
        }))
    }

    function updateCalendarEntry(forDayId: string, entry: CalendarEntry) {
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

    // Pull a calendar entry into today's daily tasks (keeps entry on calendar, marks movedTo)
    function pullEntryToDay(entry: CalendarEntry, fromDayId: string) {
        const task: Task = {
            id: crypto.randomUUID(),
            title: entry.title,
            done: false,
            createdAt: new Date().toISOString(),
        }
        setTasksByDay((prev) => ({
            ...prev,
            [dayId]: [task, ...(prev[dayId] ?? [])],
        }))
        updateCalendarEntry(fromDayId, { ...entry, movedTo: 'day' })
    }

    // Pull a calendar entry into this week's tasks
    function pullEntryToWeek(entry: CalendarEntry, fromDayId: string) {
        const task: Task = {
            id: crypto.randomUUID(),
            title: entry.title,
            done: false,
            createdAt: new Date().toISOString(),
        }
        setWeeks((prev) => {
            const existing = prev[weekId]
            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    weeklyTasks: [task, ...(existing?.weeklyTasks ?? [])],
                },
            }
        })
        updateCalendarEntry(fromDayId, { ...entry, movedTo: 'week' })
    }

    // ── Task review actions ──
    function reviewKeepToday(task: Task) {
        const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString(), done: false }
        setTasksByDay((prev) => ({
            ...prev,
            [dayId]: [newTask, ...(prev[dayId] ?? [])],
        }))
    }

    function reviewPushToWeek(task: Task) {
        const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString(), done: false }
        setWeeks((prev) => {
            const existing = prev[weekId]
            return {
                ...prev,
                [weekId]: { ...existing, weeklyTasks: [newTask, ...(existing?.weeklyTasks ?? [])] },
            }
        })
    }

    function reviewPushToMonth(task: Task, targetDayId: string) {
        const entry: CalendarEntry = {
            id: crypto.randomUUID(),
            title: task.title,
            tags: ['task'],
            done: false,
            createdAt: new Date().toISOString(),
        }
        addCalendarEntry(targetDayId, entry)
    }

    function reviewPullWeekToDay(task: Task) {
        const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString(), done: false }
        setTasksByDay((prev) => ({
            ...prev,
            [dayId]: [newTask, ...(prev[dayId] ?? [])],
        }))
        // Remove from weekly tasks
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev
            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    weeklyTasks: (existing.weeklyTasks ?? []).filter(t => t.id !== task.id),
                },
            }
        })
    }

    function next() {
        const order: MorningStep[] = [
            'greeting', 'theme', 'affirmation', 'breakfast',
            // taskReview inserted here only if yesterday had incomplete tasks
            ...(hasYesterdayTasks ? ['taskReview' as MorningStep] : []),
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

    function updateTask(updated: Task) {
        setTasksByDay((prev) => ({
            ...prev,
            [dayId]: (prev[dayId] ?? []).map((t) => t.id === updated.id ? updated : t),
        }))
    }

    function updateWeeklyTask(updated: Task) {
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev
            return {
                ...prev,
                [weekId]: {
                    ...existing,
                    weeklyTasks: (existing.weeklyTasks ?? []).map((t) =>
                        t.id === updated.id ? updated : t
                    ),
                },
            }
        })
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

            {/* Task review step — only appears in flow if yesterday had incomplete tasks */}
            {step === 'taskReview' && (
                <TaskReviewStep
                    yesterdayTasks={yesterdayIncompleteTasks}
                    yesterdayDayId={yesterdayId}
                    weeklyTasks={weeklyTasks}
                    todayTasks={todaysTasks}
                    monthEntries={monthTaskEntries}
                    onKeepToday={reviewKeepToday}
                    onPushToWeek={reviewPushToWeek}
                    onPushToMonth={reviewPushToMonth}
                    onPullWeekToDay={reviewPullWeekToDay}
                    onPullEntryToDay={pullEntryToDay}
                    onPullEntryToWeek={pullEntryToWeek}
                    onDone={next}
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
                    onUpdateTask={updateTask}
                    weeklyTasks={weeklyTasks}
                    onAddWeeklyTask={addWeeklyTask}
                    onToggleWeeklyTask={toggleWeeklyTask}
                    onDeleteWeeklyTask={deleteWeeklyTask}
                    onUpdateWeeklyTask={updateWeeklyTask}
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
                    todayDayId={dayId}
                    currentWeekId={weekId}
                    onPullEntryToDay={pullEntryToDay}
                    onPullEntryToWeek={pullEntryToWeek}
                    showResetNudge={showResetNudge}
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
                    tasksByDay={tasksByDay}
                    mealsByDay={mealsByDay}
                    journalByDay={journalByDay}
                    chatsByDay={chatsByDay}
                    calendarEntriesByDay={calendarEntriesByDay}
                    trackersByDay={trackersByDay}
                    onAddEntry={addCalendarEntry}
                    onUpdateEntry={updateCalendarEntry}
                    onDeleteEntry={deleteCalendarEntry}
                    onTrackerChange={(forDayId, updated) => setTrackersByDay(prev => ({ ...prev, [forDayId]: updated }))}
                    onClose={() => setShowCalendar(false)}
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

            {/* Standalone task review — accessible anytime from Tasks page */}
            {step === 'tasks' && showTaskReview && (
                <TaskReviewStep
                    yesterdayTasks={yesterdayIncompleteTasks}
                    yesterdayDayId={yesterdayId}
                    weeklyTasks={weeklyTasks}
                    todayTasks={todaysTasks}
                    monthEntries={monthTaskEntries}
                    onKeepToday={reviewKeepToday}
                    onPushToWeek={reviewPushToWeek}
                    onPushToMonth={reviewPushToMonth}
                    onPullWeekToDay={reviewPullWeekToDay}
                    onPullEntryToDay={pullEntryToDay}
                    onPullEntryToWeek={pullEntryToWeek}
                    onDone={() => setShowTaskReview(false)}
                    isStandalone
                />
            )}
        </main>
    )
}