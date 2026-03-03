import { useEffect, useState, useRef, useCallback } from 'react'
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { WeeksMap } from '../features/morningFlow/morningFlow.types'
import type { DailyMeals } from '../features/meals/meals.types'
import type { Task } from '../features/tasks/tasks.types'
import type { ChatMessage } from '../features/journal/journal.types'
import type { CalendarEntry, DayTracker } from '../features/calendar/calendar.types'
import type { NotebooksMap } from '../features/notebooks/notebooks.types'

const USER_ID = 'me'
const USER_REF = () => doc(db, 'users', USER_ID)

export type UserDoc = {
    weeks: WeeksMap
    mealsByDay: Record<string, DailyMeals>
    tasksByDay: Record<string, Task[]>
    notesByDay: Record<string, string>
    journalByDay: Record<string, string>
    chatsByDay: Record<string, ChatMessage[]>
    calendarEntriesByDay: Record<string, CalendarEntry[]>
    trackersByDay: Record<string, DayTracker>
    notebooks: NotebooksMap
}

const DEFAULT_USER_DOC: UserDoc = {
    weeks: {},
    mealsByDay: {},
    tasksByDay: {},
    notesByDay: {},
    journalByDay: {},
    chatsByDay: {},
    calendarEntriesByDay: {},
    trackersByDay: {},
    notebooks: {},
}

function stripUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(stripUndefined) as unknown as T
    }
    if (value !== null && typeof value === 'object') {
        const result: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (v !== undefined) {
                result[k] = stripUndefined(v)
            }
        }
        return result as T
    }
    return value
}

export function useUserDoc() {
    const [data, setData] = useState<UserDoc>(DEFAULT_USER_DOC)
    const [loading, setLoading] = useState(true)
    const dataRef = useRef<UserDoc>(DEFAULT_USER_DOC)

    // Guards against writes firing before the first Firestore snapshot has loaded.
    // Without this, any setWeeks/setX call that races the initial onSnapshot would
    // write empty defaults over real data (the likely cause of the weeks wipe).
    const loadedRef = useRef(false)
    const pendingWrites = useRef<Array<() => void>>([])

    useEffect(() => {
        const ref = USER_REF()

        const unsub = onSnapshot(ref, (snap) => {
            const next = snap.exists()
                ? { ...DEFAULT_USER_DOC, ...(snap.data() as Partial<UserDoc>) }
                : DEFAULT_USER_DOC

            setData(next)
            dataRef.current = next
            setLoading(false)

            // On the very first snapshot, flush any writes that arrived early.
            // They now run against real data instead of empty defaults.
            if (!loadedRef.current) {
                loadedRef.current = true
                const queued = pendingWrites.current
                pendingWrites.current = []
                queued.forEach(fn => fn())
            }
        })

        return unsub
    }, [])

    const updateField = useCallback(<K extends keyof UserDoc>(
        field: K,
        updater: UserDoc[K] | ((prev: UserDoc[K]) => UserDoc[K])
    ) => {
        // If the initial snapshot hasn't fired yet, queue this write rather than
        // executing it against empty defaults, which would wipe Firestore data.
        if (!loadedRef.current) {
            pendingWrites.current.push(() => updateField(field, updater))
            return
        }

        const next =
            typeof updater === 'function'
                ? (updater as (prev: UserDoc[K]) => UserDoc[K])(dataRef.current[field])
                : updater

        const nextData = { ...dataRef.current, [field]: next }
        setData(nextData)
        dataRef.current = nextData

        const safeValue = stripUndefined(next)

        updateDoc(USER_REF(), { [field]: safeValue }).catch((err) => {
            if (err.code === 'not-found') {
                setDoc(USER_REF(), stripUndefined(nextData)).catch(console.error)
            } else {
                console.error(`Failed to update "${field}":`, err)
            }
        })
    }, [])

    const setWeeks = useCallback(
        (updater: WeeksMap | ((prev: WeeksMap) => WeeksMap)) =>
            updateField('weeks', updater),
        [updateField]
    )

    const setMealsByDay = useCallback(
        (updater: Record<string, DailyMeals> | ((prev: Record<string, DailyMeals>) => Record<string, DailyMeals>)) =>
            updateField('mealsByDay', updater),
        [updateField]
    )

    const setTasksByDay = useCallback(
        (updater: Record<string, Task[]> | ((prev: Record<string, Task[]>) => Record<string, Task[]>)) =>
            updateField('tasksByDay', updater),
        [updateField]
    )

    const setNotesByDay = useCallback(
        (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) =>
            updateField('notesByDay', updater),
        [updateField]
    )

    const setJournalByDay = useCallback(
        (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) =>
            updateField('journalByDay', updater),
        [updateField]
    )

    const setChatsByDay = useCallback(
        (updater: Record<string, ChatMessage[]> | ((prev: Record<string, ChatMessage[]>) => Record<string, ChatMessage[]>)) =>
            updateField('chatsByDay', updater),
        [updateField]
    )

    const setCalendarEntriesByDay = useCallback(
        (updater: Record<string, CalendarEntry[]> | ((prev: Record<string, CalendarEntry[]>) => Record<string, CalendarEntry[]>)) =>
            updateField('calendarEntriesByDay', updater),
        [updateField]
    )

    const setTrackersByDay = useCallback(
        (updater: Record<string, DayTracker> | ((prev: Record<string, DayTracker>) => Record<string, DayTracker>)) =>
            updateField('trackersByDay', updater),
        [updateField]
    )

    const setNotebooks = useCallback(
        (updater: NotebooksMap | ((prev: NotebooksMap) => NotebooksMap)) =>
            updateField('notebooks', updater),
        [updateField]
    )

    return {
        loading,
        weeks: data.weeks,
        setWeeks,
        mealsByDay: data.mealsByDay,
        setMealsByDay,
        tasksByDay: data.tasksByDay,
        setTasksByDay,
        notesByDay: data.notesByDay,
        setNotesByDay,
        journalByDay: data.journalByDay,
        setJournalByDay,
        chatsByDay: data.chatsByDay,
        setChatsByDay,
        calendarEntriesByDay: data.calendarEntriesByDay,
        setCalendarEntriesByDay,
        trackersByDay: data.trackersByDay,
        setTrackersByDay,
        notebooks: data.notebooks,
        setNotebooks,
    }
}