import { useEffect, useMemo, useState } from 'react'
import { getWeekId, getPreviousWeekId } from '../../lib/dates'
import type { WeeksMap } from '../morningFlow/morningFlow.types'
import type { WeeklyResetStep, WeeklyResetData, WeeklyResetTaskDecision } from './weeklyReset.types'
import IntroStep from './steps/IntroStep'
import LookbackStep from './steps/LookbackStep'
import TasksStep from './steps/TasksStep'
import ThemeStep from './steps/ThemeStep'
import CompleteStep from './steps/CompleteStep'
import type { Task } from '../tasks/tasks.types'

type Props = {
    weeks: WeeksMap
    setWeeks: (updater: WeeksMap | ((prev: WeeksMap) => WeeksMap)) => void
    onClose: () => void
}

function createDefaultWeeklyReset(): WeeklyResetData {
    return { completed: false, lookback: {}, taskDecisions: {} }
}

function normalizeWeeklyReset(raw: unknown): WeeklyResetData {
    const base = createDefaultWeeklyReset()
    const r = (raw ?? {}) as Partial<WeeklyResetData>

    return {
        ...base,
        completed: r.completed ?? base.completed,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        skipped: r.skipped,
        lookback: { ...base.lookback, ...(r.lookback ?? {}) },
        pausePrompt: r.pausePrompt,
        inspiration: r.inspiration,
        behavior: r.behavior,
        taskDecisions: r.taskDecisions ?? base.taskDecisions,
    }
}

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

    return {
        ...prev,
        [weekId]: { ...merged, weeklyReset: { ...reset, startedAt: new Date().toISOString() } },
    }
}

function markWeeklyResetCompleted(prev: WeeksMap, weekId: string, skipped: boolean): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev

    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset

    return {
        ...prev,
        [weekId]: {
            ...merged,
            weeklyReset: {
                ...reset,
                completed: true,
                skipped,
                completedAt: reset.completedAt ?? new Date().toISOString(),
            },
        },
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

    return {
        ...prev,
        [weekId]: { ...merged, weeklyReset: { ...reset, lookback: { ...reset.lookback, ...patch } } },
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

    return {
        ...prev,
        [weekId]: {
            ...merged,
            weeklyReset: {
                ...reset,
                taskDecisions: { ...reset.taskDecisions, [taskId]: decision },
            },
        },
    }
}

function updateThemeFields(
    prev: WeeksMap,
    weekId: string,
    patch: { pausePrompt?: string; theme?: string; inspiration?: string; behavior?: string }
): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev

    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset
    const { theme, ...resetPatch } = patch

    return {
        ...prev,
        [weekId]: {
            ...merged,
            ...(typeof theme === 'string' ? { theme } : {}),
            weeklyReset: { ...reset, ...resetPatch },
        },
    }
}

export default function WeeklyResetFlow({ weeks, setWeeks, onClose }: Props) {
    const weekId = useMemo(() => getWeekId(new Date()), [])
    const prevWeekId = useMemo(() => getPreviousWeekId(new Date()), [])

    const week = weeks[weekId]
    const weeklyReset = week
        ? (ensureWeekHasWeeklyReset(week as any) as any).weeklyReset
        : undefined

    const prevWeek = weeks[prevWeekId]
    const prevWeeklyTasks = ((prevWeek as any)?.weeklyTasks ?? []) as Task[]

    const [step, setStep] = useState<WeeklyResetStep>('intro')

    useEffect(() => {
        if (!week) return
        setWeeks((prev) => {
            const existing = prev[weekId]
            if (!existing) return prev

            const merged = ensureWeekHasWeeklyReset(existing as any)
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

    const r = weeklyReset ?? createDefaultWeeklyReset()

    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            {step === 'intro' && (
                <IntroStep onBegin={begin} onLater={onClose} onSkipWeek={skipWeek} />
            )}

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
                        setWeeks((prev) => updateTaskDecision(prev, weekId, taskId, decision))

                        if (decision === 'carry') {
                            const t = prevWeeklyTasks.find((x) => x.id === taskId)
                            if (!t) return
                            
                            const newTask: Task = {
                                id: crypto.randomUUID(),
                                title: t.title,
                                done: false,
                                createdAt: new Date().toISOString(),
                                subtasks: t.subtasks?.map((s) => ({
                                    ...s,
                                    id: crypto.randomUUID(),
                                    done: false,
                                })),
                            }

                            setWeeks((prev) => {
                                const w = prev[weekId]
                                if (!w) return prev
                                return {
                                    ...prev,
                                    [weekId]: {
                                        ...(w as any),
                                        weeklyTasks: [newTask, ...((w as any).weeklyTasks ?? [])],
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