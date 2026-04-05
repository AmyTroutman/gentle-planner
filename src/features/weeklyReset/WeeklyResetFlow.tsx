import { useMemo, useState } from 'react'
import { getWeekId, getPreviousWeekId, getDayId } from '../../lib/dates'
import type { WeeksMap } from '../morningFlow/morningFlow.types'
import type { WeeklyResetStep, WeeklyResetData } from './weeklyReset.types'
import type { Task } from '../tasks/tasks.types'
import type { ChatMessage } from '../journal/journal.types'
import { getTasksForWeek } from '../tasks/taskHelpers'
import WrenSidebar from './WrenSidebar'
import TaskReviewStep from '../tasks/TaskReviewStep'

// ─── Helper types ─────────────────────────────────────────────────────────────

type Props = {
    weeks: WeeksMap
    setWeeks: (updater: WeeksMap | ((prev: WeeksMap) => WeeksMap)) => void
    onClose: () => void
    journalByDay: Record<string, string>
    chatsByDay: Record<string, ChatMessage[]>
    tasks: Record<string, Task>
    setTasks: (updater: Record<string, Task> | ((prev: Record<string, Task>) => Record<string, Task>)) => void
    todayDayId: string
    yesterdayDayId: string
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

function createDefaultWeeklyReset(): WeeklyResetData {
    return { completed: false, lookback: {}, taskDecisions: {}, wrenChat: [] }
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
        wrenChat: r.wrenChat ?? [],
    }
}

function ensureWeekHasWeeklyReset<TWeek extends Record<string, any>>(existing: TWeek): TWeek {
    return { ...existing, weeklyReset: normalizeWeeklyReset(existing.weeklyReset) }
}

function markWeeklyResetStarted(prev: WeeksMap, weekId: string): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev
    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset
    if (reset.startedAt) return prev
    return { ...prev, [weekId]: { ...merged, weeklyReset: { ...reset, startedAt: new Date().toISOString() } } }
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

function updateLookback(prev: WeeksMap, weekId: string, patch: { meaningful?: string; askedALot?: string }): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev
    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset
    return { ...prev, [weekId]: { ...merged, weeklyReset: { ...reset, lookback: { ...reset.lookback, ...patch } } } }
}

function updateThemeFields(prev: WeeksMap, weekId: string, patch: { pausePrompt?: string; theme?: string; inspiration?: string; behavior?: string }): WeeksMap {
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

function updateWrenChat(prev: WeeksMap, weekId: string, messages: ChatMessage[]): WeeksMap {
    const week = prev[weekId]
    if (!week) return prev
    const merged = ensureWeekHasWeeklyReset(week as any) as any
    const reset: WeeklyResetData = merged.weeklyReset
    return { ...prev, [weekId]: { ...merged, weeklyReset: { ...reset, wrenChat: messages } } }
}

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEP_LABELS: Record<WeeklyResetStep, string> = {
    intro: 'Opening',
    lookback: 'Looking back',
    theme: 'Theme',
    tasks: 'Tasks',
    complete: 'Done',
}

// ─── Dot progress ─────────────────────────────────────────────────────────────

function StepDots({ current, onBack }: { current: WeeklyResetStep; onBack: () => void }) {
    const steps: WeeklyResetStep[] = ['lookback', 'theme', 'tasks']
    const showBack = steps.includes(current) && current !== 'lookback'

    return (
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {showBack && (
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '0 0.25rem 0 0',
                        lineHeight: 1,
                    }}
                >
                    ←
                </button>
            )}
            {steps.map((s) => {
                const idx = steps.indexOf(s)
                const curIdx = steps.indexOf(current)
                const done = curIdx > idx
                const active = s === current
                return (
                    <div
                        key={s}
                        title={STEP_LABELS[s]}
                        style={{
                            width: active ? 20 : 7,
                            height: 7,
                            borderRadius: 4,
                            background: done ? '#2c454d' : active ? '#2c454d' : '#d1d5db',
                            opacity: done ? 0.4 : 1,
                            transition: 'all 0.25s ease',
                        }}
                    />
                )
            })}
        </div>
    )
}

// ─── Confirm panel ────────────────────────────────────────────────────────────

function ConfirmPanel({ title, children, open, onToggle }: {
    title: string
    children: React.ReactNode
    open: boolean
    onToggle: () => void
}) {
    return (
        <div style={{
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: 'white',
            overflow: 'hidden',
        }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.9rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--muted)',
                    fontFamily: 'inherit',
                }}
            >
                <span>{title}</span>
                <span style={{ fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div style={{ padding: '0 0.9rem 0.9rem', borderTop: '1px solid #f3f4f6' }}>
                    {children}
                </div>
            )}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeeklyResetFlow({ weeks, setWeeks, onClose, journalByDay, chatsByDay, tasks, setTasks, todayDayId, yesterdayDayId }: Props) {
    const weekId = useMemo(() => getWeekId(new Date()), [])
    const prevWeekId = useMemo(() => getPreviousWeekId(new Date()), [])

    const week = weeks[weekId]
    const weeklyReset = week ? (ensureWeekHasWeeklyReset(week as any) as any).weeklyReset as WeeklyResetData : undefined

    const prevWeek = weeks[prevWeekId]
    const prevWeeklyTasks = getTasksForWeek(tasks, prevWeekId)
    const prevWeekTheme = (prevWeek as any)?.theme as string | undefined

    const [step, setStep] = useState<WeeklyResetStep>('intro')
    const [pendingNext, setPendingNext] = useState(false)

    const [lookbackOpen, setLookbackOpen] = useState(false)
    const [themeOpen, setThemeOpen] = useState(false)

    const wrenChat: ChatMessage[] = weeklyReset?.wrenChat ?? []

    const prevWeekDayIds = useMemo(() => {
        const ids: string[] = []
        const start = new Date(prevWeekId)
        for (let i = 0; i < 7; i++) {
            const d = new Date(start)
            d.setDate(d.getDate() + i)
            ids.push(getDayId(d))
        }
        return ids
    }, [prevWeekId])

    const wrenContext = useMemo(() => {
        const reflections = (prevWeek as any)?.reflections ?? []
        const reflectionTexts: string[] = reflections.map((r: { text: string }) => r.text).filter(Boolean)

        const journalTexts: string[] = prevWeekDayIds
            .map((id) => journalByDay[id])
            .filter(Boolean) as string[]

        const chatTexts: string[] = prevWeekDayIds
            .flatMap((id) => (chatsByDay[id] ?? []).map((m: ChatMessage) => m.content))
            .filter(Boolean)

        return {
            currentStep: step,
            prevWeekTheme,
            reflections: reflectionTexts,
            journalEntries: journalTexts,
            chatMessages: chatTexts,
            prevWeeklyTasks: prevWeeklyTasks.map((t) => ({ title: t.title, done: t.done })),
            lookback: weeklyReset?.lookback,
        }
    }, [step, prevWeek, prevWeekDayIds, journalByDay, chatsByDay, prevWeekTheme, prevWeeklyTasks, weeklyReset?.lookback])

    function begin() {
        setWeeks((prev) => markWeeklyResetStarted(prev, weekId))
        setStep('lookback')
    }

    function skipWeek() {
        setWeeks((prev) => markWeeklyResetCompleted(prev, weekId, true))
        onClose()
    }

    function advanceStep() {
        setPendingNext(false)
        if (step === 'intro') { begin(); return }
        if (step === 'lookback') { setStep('theme'); return }
        if (step === 'theme') { setStep('tasks'); return }
        if (step === 'tasks') { finish();  return }
        if (step === 'complete') { onClose(); return }
    }

    function goBack() {
        setPendingNext(false)
        if (step === 'lookback') { setStep('intro'); return }
        if (step === 'theme') { setStep('lookback'); return }
        if (step === 'tasks') { setStep('theme'); return }
    }

    function continueStep() {
        setPendingNext(false)
        if (step === 'lookback') { setStep('theme'); return }
        if (step === 'theme') { setStep('tasks'); return }
        if (step === 'tasks') { finish(); return }
    }

    function finish() {
        setWeeks((prev) => markWeeklyResetCompleted(prev, weekId, false))
        onClose()
    }

    if (!week) {
        return (
            <section style={{ padding: '2rem' }}>
                <p style={{ color: 'var(--muted)' }}>Week data not ready yet.</p>
            </section>
        )
    }

    const r = weeklyReset ?? createDefaultWeeklyReset()
    const showDots = step !== 'intro' && step !== 'complete'

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '1.5rem',
            height: 'calc(100vh - 8rem)',
            maxHeight: 780,
            minHeight: 480,
        }}>
            {/* ── Left: reset content ───────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                gap: '1rem',
                minHeight: 0,
                overflowY: 'auto',
            }}>
                {/* Header */}
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #f3f4f6',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#2c454d' }}>Weekly Reset</h2>
                        {showDots && <StepDots current={step} onBack={goBack} />}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                        }}
                    >
                        Close
                    </button>
                </header>

                {/* Step content */}
                <div style={{ minHeight: 0, overflowY: 'auto', display: 'grid', gap: '1rem', alignContent: 'start' }}>

                    {step === 'intro' && (
                        <div style={{ display: 'grid', gap: '1rem', paddingTop: '1rem' }}>
                            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                Wren will guide you through your reset. Take your time — everything here is skippable.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={begin}
                                    style={{
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: '#2c454d',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Begin reset
                                </button>
                                <button
                                    onClick={skipWeek}
                                    style={{
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: 10,
                                        border: '1px solid #d1d5db',
                                        background: 'white',
                                        color: 'var(--muted)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Skip this week
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'lookback' && (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                                Take a moment to look back. Wren can help you find the thread.
                            </p>
                            <ConfirmPanel
                                title="Save lookback notes (optional)"
                                open={lookbackOpen}
                                onToggle={() => setLookbackOpen((o) => !o)}
                            >
                                <div style={{ display: 'grid', gap: '0.75rem', paddingTop: '0.75rem' }}>
                                    <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.88rem', color: '#374151' }}>
                                        What felt meaningful? What mattered to you most? What made you happy?
                                        <textarea
                                            rows={2}
                                            value={r.lookback.meaningful ?? ''}
                                            onChange={(e) => setWeeks((prev) => updateLookback(prev, weekId, { meaningful: e.target.value }))}
                                            style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '0.5rem', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'vertical' }}
                                        />
                                    </label>
                                    <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.88rem', color: '#374151' }}>
                                        What asked a lot of you, was frustrating or upsetting?
                                        <textarea
                                            rows={2}
                                            value={r.lookback.askedALot ?? ''}
                                            onChange={(e) => setWeeks((prev) => updateLookback(prev, weekId, { askedALot: e.target.value }))}
                                            style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '0.5rem', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'vertical' }}
                                        />
                                    </label>
                                </div>
                            </ConfirmPanel>
                            <button onClick={continueStep} style={{ alignSelf: 'start', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>
                                Continue →
                            </button>
                        </div>
                    )}

                    {step === 'theme' && (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                                Wren will help you find a theme for the week. She'll also offer some affirmations once you land on one.
                            </p>
                            <ConfirmPanel
                                title="Save theme details (optional)"
                                open={themeOpen}
                                onToggle={() => setThemeOpen((o) => !o)}
                            >
                                <div style={{ display: 'grid', gap: '0.75rem', paddingTop: '0.75rem' }}>
                                    <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.88rem', color: '#374151' }}>
                                        Theme
                                        <input
                                            value={(week as any).theme ?? ''}
                                            onChange={(e) => setWeeks((prev) => updateThemeFields(prev, weekId, { theme: e.target.value }))}
                                            style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '0.5rem', fontFamily: 'inherit', fontSize: '0.88rem' }}
                                        />
                                    </label>
                                    <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.88rem', color: '#374151' }}>
                                        What pointed you here?
                                        <textarea
                                            rows={2}
                                            value={r.pausePrompt ?? ''}
                                            onChange={(e) => setWeeks((prev) => updateThemeFields(prev, weekId, { pausePrompt: e.target.value }))}
                                            style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '0.5rem', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'vertical' }}
                                        />
                                    </label>
                                    <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.88rem', color: '#374151' }}>
                                        One small way to live it
                                        <input
                                            value={r.behavior ?? ''}
                                            onChange={(e) => setWeeks((prev) => updateThemeFields(prev, weekId, { behavior: e.target.value }))}
                                            style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '0.5rem', fontFamily: 'inherit', fontSize: '0.88rem' }}
                                        />
                                    </label>
                                </div>
                            </ConfirmPanel>
                            <button onClick={continueStep} style={{ alignSelf: 'start', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>
                                Continue →
                            </button>
                        </div>
                    )}

                    {step === 'tasks' && (
                        <TaskReviewStep
                            tasks={tasks}
                            setTasks={setTasks}
                            yesterdayDayId={yesterdayDayId}
                            todayDayId={todayDayId}
                            weekId={weekId}
                            prevWeekId={prevWeekId}
                            onDone={finish}
                            isStandalone={false}
                        />
                    )}
                </div>
            </div>

            {/* ── Right: Wren sidebar ───────────────────────────── */}
            <WrenSidebar
                messages={wrenChat}
                onMessagesChange={(msgs) => setWeeks((prev) => updateWrenChat(prev, weekId, msgs))}
                context={wrenContext}
                onSuggestNext={() => setPendingNext(true)}
                onConfirmNext={advanceStep}
                pendingNext={pendingNext}
                stepLabel={STEP_LABELS[step]}
            />
        </div>
    )
}