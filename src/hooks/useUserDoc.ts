import { useEffect, useState, useRef } from 'react'
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
}

const DEFAULT_USER_DOC: UserDoc = {
    weeks: {},
    mealsByDay: {},
    tasksByDay: {},
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

    function updateField<K extends keyof UserDoc>(
        field: K,
        updater: UserDoc[K] | ((prev: UserDoc[K]) => UserDoc[K])
    ) {
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
    }

    return {
        loading,
        weeks: data.weeks,
        setWeeks: (updater: WeeksMap | ((prev: WeeksMap) => WeeksMap)) =>
            updateField('weeks', updater),
        mealsByDay: data.mealsByDay,
        setMealsByDay: (
            updater:
                | Record<string, DailyMeals>
                | ((prev: Record<string, DailyMeals>) => Record<string, DailyMeals>)
        ) => updateField('mealsByDay', updater),
        tasksByDay: data.tasksByDay,
        setTasksByDay: (
            updater:
                | Record<string, Task[]>
                | ((prev: Record<string, Task[]>) => Record<string, Task[]>)
        ) => updateField('tasksByDay', updater),
    }
}