import { useState, useEffect } from 'react'
import type { MorningStep, Reflection, WeekData } from './morningFlow.types'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import GreetingStep from './steps/GreetingStep'
import ThemeStep from './steps/ThemeStep'
import { getDayId, getWeekId } from '../../lib/dates'
import AffirmationStep from './steps/AffirmationStep'
import { BASE_AFFIRMATIONS } from '../../lib/affirmations'
import BreakfastStep from './steps/BreakfastStep'

type WeeksMap = Record<string, WeekData>

export default function MorningFlow() {
    const [step, setStep] = useState<MorningStep>('greeting')

    const weekId = getWeekId()
    const dayId = getDayId()

    const [weeks, setWeeks] = useLocalStorage<WeeksMap>('gentlePlanner.weeks', {})

    type DayLog = {
        breakfast?: string
        drink?: 'caf' | 'decaf' | 'tea' | 'none'
    }

    const [dayLog, setDayLog] = useLocalStorage<Record<string, DayLog>>(
        'gentlePlanner.dayLog',
        {}
    )

    // For now: fallback theme if not set yet
    const weeklyTheme = weeks[weekId]?.theme ?? 'kind'
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
        ]

        const currentIndex = order.indexOf(step)
        const nextStep = order[currentIndex + 1]
        if (nextStep) setStep(nextStep)
    }

    function setBreakfastAndDrink(payload: { breakfast: string; drink: 'caf' | 'decaf' | 'tea' | 'none' }) {
        setDayLog((prev) => ({
            ...prev,
            [dayId]: { ...(prev[dayId] ?? {}), breakfast: payload.breakfast, drink: payload.drink },
        }))
        next()
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

            {step !== 'greeting' && step !== 'theme' && step !== 'affirmation' && (
                <>
                    <h2>Current step: {step}</h2>
                    <button onClick={next}>Next</button>
                </>
            )}
            
        </main>
    )
}
