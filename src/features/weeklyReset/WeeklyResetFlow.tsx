import { useEffect, useMemo, useState } from 'react'
import { getWeekId, getDayId } from '../../lib/dates'
import type { WeeksMap } from '../morningFlow/morningFlow.types'
import type { WeeklyResetStep, WeeklyResetData, WeeklyResetTaskDecision } from './weeklyReset.types'
import IntroStep from './steps/IntroStep'
import LookbackStep from './steps/LookbackStep'
import TasksStep from './steps/TasksStep'
import ThemeStep from './steps/ThemeStep'
import CompleteStep from './steps/CompleteStep'
import type { Task } from '../tasks/tasks.types' // adjust path if needed

function seedLastWeekWeeklyTasks(prev: WeeksMap, prevWeekId: string): WeeksMap {
    const w = prev[prevWeekId]
    if (!w) return prev

    const now = new Date().toISOString()

    const seed: Task[] = [
        { id: crypto.randomUUID(), title: 'Email that one person back', done: false, createdAt: now },
        { id: crypto.randomUUID(), title: 'Schedule appointment', done: false, createdAt: now },
        { id: crypto.randomUUID(), title: 'Plan groceries', done: false, createdAt: now },
        { id: crypto.randomUUID(), title: 'Submit that form', done: false, createdAt: now },
    ]

    // Keep any existing tasks; just add a few more
    const existing = ((w as any).weeklyTasks ?? []) as Task[]

    return {
        ...prev,
        [prevWeekId]: {
            ...(w as any),
            weeklyTasks: [...seed, ...existing],
        },
    }
}

type Props = {
    weeks: WeeksMap
    setWeeks: React.Dispatch<React.SetStateAction<WeeksMap>>
    onClose: () => void
}

function createDefaultWeeklyReset(): WeeklyResetData {
    return { completed: false, lookback: {}, taskDecisions: {} }
}

/**
 * Normalize unknown/partial weeklyReset into a complete WeeklyResetData.
 * Critical: taskDecisions + lookback must always exist at runtime.
 */
function normalizeWeeklyReset(raw: unknown): WeeklyResetData {
    const base = createDefaultWeeklyReset()
    const r = (raw ?? {}) as Partial<WeeklyResetData>

    return {
        ...base,
        completed: r.completed ?? base.completed,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        skipped: r.skipped,

        lookback: {
            ...base.lookback,
            ...(r.lookback ?? {}),
        },

        pausePrompt: r.pausePrompt,
        inspiration: r.inspiration,
        behavior: r.behavior,

        taskDecisions: r.taskDecisions ?? base.taskDecisions,
    }
}

/**
 * Non-destructive: keeps all unknown fields on the week object.
 * But ensures weeklyReset is present AND normalized.
 */
function ensureWeekHasWeeklyReset<TWeek extends Record<string, any>>(existing: TWeek): TWeek {
    return {
        ...existing,
        weeklyReset: normalizeWeeklyReset(existing.weeklyReset),
    }
}

function markWeeklyResetStarted(prev: WeeksMap, weekId: string): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev

    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset

    if (reset.startedAt) return prev

    const nextReset: WeeklyResetData = {
        ...reset,
        startedAt: new Date().toISOString(),
    }

    return {
        ...prev,
        [weekId]: { ...merged, weeklyReset: nextReset },
    }
}

function markWeeklyResetCompleted(prev: WeeksMap, weekId: string, skipped: boolean): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev

    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset

    const nextReset: WeeklyResetData = {
        ...reset,
        completed: true,
        skipped,
        completedAt: reset.completedAt ?? new Date().toISOString(),
    }

    return {
        ...prev,
        [weekId]: { ...merged, weeklyReset: nextReset },
    }
}

function updateLookback(
    prev: WeeksMap,
    weekId: string,
    patch: { meaningful?: string; askedALot?: string }
): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev

    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset

    const nextReset: WeeklyResetData = {
        ...reset,
        lookback: {
            ...reset.lookback,
            ...patch,
        },
    }

    return {
        ...prev,
        [weekId]: { ...merged, weeklyReset: nextReset },
    }
}

function updateTaskDecision(
    prev: WeeksMap,
    weekId: string,
    taskId: string,
    decision: WeeklyResetTaskDecision
): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev

    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset

    const nextReset: WeeklyResetData = {
        ...reset,
        taskDecisions: {
            ...reset.taskDecisions,
            [taskId]: decision,
        },
    }

    return {
        ...prev,
        [weekId]: { ...merged, weeklyReset: nextReset },
    }
}

function updateThemeFields(
    prev: WeeksMap,
    weekId: string,
    patch: {
        pausePrompt?: string
        theme?: string
        inspiration?: string
        behavior?: string
    }
): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev

    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset

    const { theme, ...resetPatch } = patch

    const nextReset: WeeklyResetData = {
        ...reset,
        ...resetPatch,
    }

    return {
        ...prev,
        [weekId]: {
            ...merged,
            ...(typeof theme === 'string' ? { theme } : {}),
            weeklyReset: nextReset,
        },
    }
}

export default function WeeklyResetFlow({ weeks, setWeeks, onClose }: Props) {
    const weekId = useMemo(() => getWeekId(new Date()), [])
    const dayId = useMemo(() => getDayId(new Date()), [])

    // Previous week id (simple 7-day offset; good enough for weekly buckets)
    const prevWeekId = useMemo(() => getWeekId(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), [])

    const week = weeks[weekId]
    const weeklyReset = week ? (ensureWeekHasWeeklyReset(week as any) as any).weeklyReset : undefined

    const prevWeek = weeks[prevWeekId]
    const prevWeeklyTasks = ((prevWeek as any)?.weeklyTasks ?? []) as import('../tasks/tasks.types').Task[]

    const [step, setStep] = useState<WeeklyResetStep>('intro')

    useEffect(() => {
        if (!week) return
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            const merged = ensureWeekHasWeeklyReset(existing as any)

            // If weeklyReset existed but was partial/old, we still want to write back normalized.
            const before = (existing as any).weeklyReset
            const after = (merged as any).weeklyReset
            const changed = JSON.stringify(before) !== JSON.stringify(after)

            if (!changed) return prev
            return { ...prev, [weekId]: merged }
        })
    }, [weekId, week, setWeeks])

    function begin() {
        setWeeks((prev) => markWeeklyResetStarted(prev, weekId))
        setStep('lookback')
    }

    function later() {
        onClose()
    }

    function skipWeek() {
        setWeeks((prev) => markWeeklyResetCompleted(prev, weekId, true))
        onClose()
    }

    function skipThisStep() {
        if (step === 'intro') return onClose()
        if (step === 'lookback') return setStep('tasks')
        if (step === 'tasks') return setStep('theme')
        if (step === 'theme') return finish()
    }

    function finish() {
        setWeeks((prev) => markWeeklyResetCompleted(prev, weekId, false))
        setStep('complete')
    }

    if (!week) {
        return (
            <section>
                <p style={{ color: 'var(--muted)' }}>Week data not ready yet.</p>
            </section>
        )
    }

    // Always normalized at this point
    const r = weeklyReset ?? createDefaultWeeklyReset()

    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span>
                    weekId: {weekId} • dayId: {dayId}
                </span>

                <button
                    onClick={() => setWeeks((prev) => seedLastWeekWeeklyTasks(prev, prevWeekId))}>
                    Seed last week weeklyTasks
                </button>
            </div>

            {step === 'intro' && <IntroStep onBegin={begin} onLater={later} onSkipWeek={skipWeek} />}

            {step === 'lookback' && (
                <LookbackStep
                    meaningful={r.lookback.meaningful}
                    askedALot={r.lookback.askedALot}
                    onSave={(meaningful, askedALot) => {
                        setWeeks((prev) => updateLookback(prev, weekId, { meaningful, askedALot }))
                    }}
                    onNext={() => setStep('tasks')}
                    onSkip={skipThisStep}
                />
            )}

            {step === 'tasks' && (
                <TasksStep
                    tasks={prevWeeklyTasks}
                    taskDecisions={r.taskDecisions}
                    onDecide={(taskId, decision) => {
                        // record the decision so it “fades away”
                        setWeeks((prev) => updateTaskDecision(prev, weekId, taskId, decision))

                        if (decision === 'carry') {
                            const t = prevWeeklyTasks.find((x) => x.id === taskId)
                            if (!t) return

                            const now = new Date().toISOString()
                            const newTask = {
                                id: crypto.randomUUID(),
                                title: t.title,
                                done: false,
                                createdAt: now,
                            }

                            // add to *this* week’s weeklyTasks (last week remains untouched)
                            setWeeks((prev) => {
                                const w = prev[weekId]
                                if (!w) return prev
                                return {
                                    ...prev,
                                    [weekId]: {
                                        ...(w as any),
                                        weeklyTasks: [newTask, ...(((w as any).weeklyTasks ?? []) as any[])],
                                    },
                                }
                            })
                        }
                    }}
                    onNext={() => setStep('theme')}
                    onSkip={skipThisStep}
                />
            )}

            {step === 'theme' && (
                <ThemeStep
                    pausePrompt={r.pausePrompt}
                    // theme is on the week, not weeklyReset
                    theme={(week as any).theme}
                    inspiration={r.inspiration}
                    behavior={r.behavior}
                    onSave={(patch) => setWeeks((prev) => updateThemeFields(prev, weekId, patch))}
                    onNext={finish}
                    onSkip={skipThisStep}
                />
            )}

            {step === 'complete' && <CompleteStep onDone={onClose} />}
        </section>
    )
}
