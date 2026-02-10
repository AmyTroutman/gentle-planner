import { useMemo, useState } from 'react'
import type { Reflection } from '../morningFlow.types'

type Props = {
    weeklyTheme: string
    reflections: Reflection[]
    onAddReflection: (text: string) => void
    onSkip: () => void
}

export default function ReflectionStep({
    weeklyTheme,
    reflections,
    onAddReflection,
    onSkip,
}: Props) {
    const [text, setText] = useState('')

    const sorted = useMemo(() => {
        return [...reflections].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }, [reflections])

    function submit() {
        const cleaned = text.trim()
        if (!cleaned) return
        onAddReflection(cleaned)
        setText('')
    }

    return (
        <section style={{ display: 'grid', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>
                Reflect on <span style={{ fontStyle: 'italic' }}>{weeklyTheme}</span>
            </h2>

            {sorted.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--muted)' }}>
                        Here’s what you’ve already noticed:
                    </p>

                    <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.5 }}>
                        {sorted.slice(0, 5).map((r) => (
                            <li key={r.id}>{r.text}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                    What does this look like in everyday life?
                </p>
            )}

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Anything that comes to mind is enough."
                rows={4}/>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={submit}
                    disabled={!text.trim()}>
                    Reflect
                </button>

                <button
                    onClick={onSkip}
                    style={{
                        color: 'var(--muted)',
                    }}
                >
                    Skip for now
                </button>
            </div>
        </section>
    )
}
