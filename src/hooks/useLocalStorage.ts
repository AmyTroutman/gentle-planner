import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key)
            if (!raw) return initialValue
            return JSON.parse(raw) as T
        } catch {
            return initialValue
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // If storage is full or blocked, we fail quietly.
            // This app should still work in-session.
        }
    }, [key, value])

    return [value, setValue] as const
}
