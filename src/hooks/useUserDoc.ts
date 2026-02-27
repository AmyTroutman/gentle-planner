import { useEffect, useState, useRef, useCallback } from 'react'
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { WeeksMap } from '../features/morningFlow/morningFlow.types'
import type { DailyMeals } from '../features/meals/meals.types'
import type { Task } from '../features/tasks/tasks.types'
import type { ChatMessage } from '../features/journal/journal.types'
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
    notebooks: NotebooksMap
}

const DEFAULT_USER_DOC: UserDoc = {
    weeks: {},
    mealsByDay: {},
    tasksByDay: {},
    notesByDay: {},
    journalByDay: {},
    chatsByDay: {},
    notebooks: {},
}

/**
 * Recursively remove undefined values from an object so Firestore doesn't reject them.
 * Firestore accepts null but not undefined.
 */
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

    useEffect(() => {
        const ref = USER_REF()

        const unsub = onSnapshot(ref, (snap) => {
            const next = snap.exists()
                ? { ...DEFAULT_USER_DOC, ...(snap.data() as Partial<UserDoc>) }
                : DEFAULT_USER_DOC

            setData(next)
            dataRef.current = next
            setLoading(false)
        })

        return unsub
    }, [])

    const updateField = useCallback(<K extends keyof UserDoc>(
        field: K,
        updater: UserDoc[K] | ((prev: UserDoc[K]) => UserDoc[K])
    ) => {
        const next =
            typeof updater === 'function'
                ? (updater as (prev: UserDoc[K]) => UserDoc[K])(dataRef.current[field])
                : updater

        // Optimistic local update (keep undefined for local state — fine in JS)
        const nextData = { ...dataRef.current, [field]: next }
        setData(nextData)
        dataRef.current = nextData

        // Strip undefined before sending to Firestore
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
        notebooks: data.notebooks,
        setNotebooks,
    }
}