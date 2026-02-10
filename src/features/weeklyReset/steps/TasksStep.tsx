import { useMemo, useState } from 'react'
import TypingText from '../../../components/TypingText'
import type { Task } from '../../tasks/tasks.types'
import type { WeeklyResetTaskDecision } from '../weeklyReset.types'

type Props = {
    tasks: Task[]
    taskDecisions: Record<string, WeeklyResetTaskDecision>
    onDecide: (taskId: string, decision: WeeklyResetTaskDecision) => void
    onNext: () => void
    onSkip: () => void
}

const EXIT_MS = 220

export default function TasksStep({ tasks, taskDecisions, onDecide, onNext, onSkip }: Props) {
    const [typingDone, setTypingDone] = useState(false)

    // Track rows currently animating out
    const [exiting, setExiting] = useState<Record<string, true>>({})

    const remaining = useMemo(
        () => tasks.filter((t) => !t.done && !taskDecisions[t.id]),
        [tasks, taskDecisions]
    )

    function decideWithFade(taskId: string, decision: WeeklyResetTaskDecision) {
        // If already exiting, ignore double-clicks
        if (exiting[taskId]) return

        setExiting((m) => ({ ...m, [taskId]: true }))

        // After the fade completes, persist the decision (which removes it from the list)
        window.setTimeout(() => {
            onDecide(taskId, decision)
            setExiting((m) => {
                const next = { ...m }
                delete next[taskId]
                return next
            })
        }, EXIT_MS)
    }

    return (
        <section style={{ display: 'grid', gap: '1rem' }}>
            <TypingText text="Clear Space for the Week Ahead" speed={45} onComplete={() => setTypingDone(true)} />

            {typingDone && (
                <>
                    <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.45 }}>
                        Carry forward what still matters. Release what doesn’t need you anymore.
                    </p>

                    {remaining.length === 0 ? (
                        <p style={{ margin: 0, color: 'var(--muted)' }}>You’re clear. Nothing else needs a decision.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
                            {remaining.map((t) => {
                                const isExiting = !!exiting[t.id]
                                return (
                                    <li
                                        key={t.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem', // tighter gap between text and buttons
                                            padding: '0.5rem 0.65rem', // tighter row padding
                                            borderRadius: 12,
                                            border: '1px solid var(--border)',
                                            background: 'var(--panel)',

                                            // animation
                                            opacity: isExiting ? 0 : 1,
                                            transform: isExiting ? 'translateY(-4px)' : 'translateY(0)',
                                            transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease`,
                                        }}
                                    >
                                        <span style={{ flex: 1, fontSize: '0.95rem', lineHeight: 1.25 }}>
                                            {t.title}
                                        </span>

                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => decideWithFade(t.id, 'carry')}
                                                disabled={isExiting}
                                                style={{ opacity: isExiting ? 0.6 : 1 }}
                                            >
                                                ✅ Carry forward
                                            </button>
                                            <button
                                                onClick={() => decideWithFade(t.id, 'release')}
                                                disabled={isExiting}
                                                style={{ opacity: isExiting ? 0.6 : 1 }}
                                            >
                                                🌿 Release
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={onNext}>Continue</button>
                        <button onClick={onSkip}>Skip</button>
                    </div>
                </>
            )}
        </section>
    )
}
