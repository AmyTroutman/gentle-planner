import { useMemo, useState } from 'react'
import TypingText from '../../../components/TypingText'
import type { Reflection } from '../morningFlow.types'

type Props = {
    weeklyTheme: string
    reflections: Reflection[]
    onAddReflection: (text: string) => void
    onDeleteReflection: (id: string) => void
    onContinue: () => void
}

function previewText(full: string) {
    const firstLine = full.split('\n')[0]?.trim() ?? ''
    if (firstLine.length <= 80) return firstLine
    return firstLine.slice(0, 80) + '…'
}

export default function ThemeStep({
    weeklyTheme,
    reflections,
    onAddReflection,
    onDeleteReflection,
    onContinue,
}: Props) {
    const [typingDone, setTypingDone] = useState(false)
    const [text, setText] = useState('')
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

    const sorted = useMemo(() => {
        return [...reflections].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }, [reflections])

    function submit() {
        const cleaned = text.trim()
        if (!cleaned) return
        onAddReflection(cleaned)
        setText('')
        onContinue()
    }

    function toggle(id: string) {
        setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <section style={{ display: 'grid', gap: '1rem' }}>
            <TypingText
                text={`This week is all about “${weeklyTheme}”`}
                speed={45}
                onComplete={() => setTypingDone(true)}
            />

            {typingDone && (
                <>
                    <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>
                        What does this look like in everyday life?
                    </p>

                    {sorted.length > 0 && (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <p style={{ margin: 0, color: 'var(--muted)' }}>
                                Your reflections so far:
                            </p>

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {sorted.map((r) => {
                                    const expanded = !!expandedIds[r.id]

                                    return (
                                        <div
                                            key={r.id}
                                            style={{
                                                borderRadius: 12,
                                                border: '1px solid #d1d5db',
                                                background: 'white',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <button
                                                onClick={() => toggle(r.id)}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.75rem',
                                                    border: 'none',
                                                    background: 'transparent',
                                                }}
                                            >
                                                <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                                                    {expanded ? r.text : previewText(r.text)}
                                                </div>
                                                <div
                                                    style={{
                                                        marginTop: '0.35rem',
                                                        color: 'var(--muted)',
                                                        fontSize: '0.85rem',
                                                    }}
                                                >
                                                    {expanded ? 'Click to collapse' : 'Click to expand'}
                                                </div>
                                            </button>

                                            {expanded && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        padding: '0.5rem 0.75rem 0.75rem',
                                                        gap: '0.5rem',
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            onDeleteReflection(r.id)
                                                            // if it was expanded, collapse it to avoid stale UI
                                                            setExpandedIds((prev) => {
                                                                const copy = { ...prev }
                                                                delete copy[r.id]
                                                                return copy
                                                            })
                                                        }}
                                                        style={{
                                                            padding: '0.35rem 0.6rem',
                                                            borderRadius: 10,
                                                            border: '1px solid #d1d5db',
                                                            background: 'transparent',
                                                            color: 'var(--muted)',
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                            </div>
                        </div>
                    )}

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Anything that comes to mind is enough."
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            resize: 'vertical',
                            fontSize: '1rem',
                        }}
                    />

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={submit}
                            disabled={!text.trim()}
                            style={{
                                padding: '0.6rem 0.9rem',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                background: 'white',
                                opacity: text.trim() ? 1 : 0.6,
                            }}
                        >
                            Reflect
                        </button>

                        <button
                            onClick={onContinue}
                            style={{
                                padding: '0.6rem 0.9rem',
                                borderRadius: 10,
                                border: '1px solid transparent',
                                background: 'transparent',
                                color: 'var(--muted)',
                            }}
                        >
                            Continue
                        </button>
                    </div>
                </>
            )}
        </section>
    )
}
