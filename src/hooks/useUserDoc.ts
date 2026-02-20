import { useEffect, useState, useRef, useCallback } from 'react'
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { WeeksMap } from '../features/morningFlow/morningFlow.types'
import type { DailyMeals } from '../features/meals/meals.types'
import type { Task } from '../features/tasks/tasks.types'

const USER_ID = 'me'
const USER_REF = () => doc(db, 'users', USER_ID)

export type UserDoc = {
    weeks: WeeksMap
    mealsByDay: Record<string, DailyMeals>
    tasksByDay: Record<string, Task[]>
    notesByDay: Record<string, string>
}

const DEFAULT_USER_DOC: UserDoc = {
    weeks: {},
    mealsByDay: {},
    tasksByDay: {},
    notesByDay: {},
}

export function useUserDoc() {
    const [data, setData] = useState<UserDoc>(DEFAULT_USER_DOC)
    const [loading, setLoading] = useState(true)
    // dataRef lets our callbacks always see current data without
    // needing to be in dependency arrays (which would cause re-renders)
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
    }, []) // runs once on mount

    // useCallback with empty deps — safe because it only touches dataRef (a ref, not state)
    const updateField = useCallback(<K extends keyof UserDoc>(
        field: K,
        updater: UserDoc[K] | ((prev: UserDoc[K]) => UserDoc[K])
    ) => {
        const next =
            typeof updater === 'function'
                ? (updater as (prev: UserDoc[K]) => UserDoc[K])(dataRef.current[field])
                : updater

        // Optimistic local update
        const nextData = { ...dataRef.current, [field]: next }
        setData(nextData)
        dataRef.current = nextData

        // Persist just the changed field
        updateDoc(USER_REF(), { [field]: next }).catch((err) => {
            // Doc might not exist yet on first write — fall back to setDoc
            if (err.code === 'not-found') {
                setDoc(USER_REF(), nextData).catch(console.error)
            } else {
                console.error(`Failed to update "${field}":`, err)
            }
        })
    }, []) // stable — never recreated

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
    }
}