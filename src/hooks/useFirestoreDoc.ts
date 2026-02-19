import { useEffect, useState, useRef } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Single user personal app — fixed ID instead of auth for now.
const USER_ID = 'me'

export function useFirestoreDoc<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(initialValue)
    const [loading, setLoading] = useState(true)
    // Track the latest value in a ref so the updater function always has
    // access to current state without needing it as a dependency.
    const valueRef = useRef<T>(initialValue)

    useEffect(() => {
        const ref = doc(db, 'plannerData', USER_ID, 'keys', key)

        const unsub = onSnapshot(ref, (snap) => {
            const next = snap.exists() ? (snap.data().value as T) : initialValue
            setValue(next)
            valueRef.current = next
            setLoading(false)
        })

        return unsub
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    function updateValue(updater: T | ((prev: T) => T)) {
        const next =
            typeof updater === 'function'
                ? (updater as (prev: T) => T)(valueRef.current)
                : updater

        // Optimistically update local state immediately (feels instant)
        setValue(next)
        valueRef.current = next

        // Then persist to Firestore
        const ref = doc(db, 'plannerData', USER_ID, 'keys', key)
        setDoc(ref, { value: next }).catch((err) => {
            console.error(`Failed to save "${key}" to Firestore:`, err)
        })
    }

    return [value, updateValue, loading] as const
}