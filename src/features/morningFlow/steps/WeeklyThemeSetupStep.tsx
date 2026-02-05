import { useState } from 'react'
import TypingText from '../../../components/TypingText'

type Props = {
    onSave: (theme: string) => void
    onSkip?: () => void // optional if you want to allow skipping
}

export default function WeeklyThemeSetupStep({ onSave, onSkip }: Props) {
    const [promptDone, setPromptDone] = useState(false)
    const [theme, setTheme] = useState('')

    function submit() {
        const cleaned = theme.trim()
        if (!cleaned) return
        onSave(cleaned)
    }

    return (
        <section style={{ display: 'grid', gap: '1rem' }}>
            <TypingText
                text="This week is all about…"
                speed={55}
                onComplete={() => setPromptDone(true)}
            />

            {promptDone && (
                <>
                    <input
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="e.g., Be kind / Be brave / Stay steady"
                        style={{
                            width: '100%',
                            padding: '0.8rem 0.85rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            fontSize: '1rem',
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') submit()
                        }}
                    />

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={submit}
                            disabled={!theme.trim()}
                            style={{
                                padding: '0.7rem 1rem',
                                borderRadius: 12,
                                border: '1px solid #d1d5db',
                                background: 'white',
                                opacity: theme.trim() ? 1 : 0.6,
                            }}
                        >
                            Set theme
                        </button>

                        {onSkip && (
                            <button
                                onClick={onSkip}
                                style={{
                                    padding: '0.7rem 1rem',
                                    borderRadius: 12,
                                    border: '1px solid #d1d5db',
                                    background: 'transparent',
                                    color: 'var(--muted)',
                                }}
                            >
                                Skip for now
                            </button>
                        )}
                    </div>
                </>
            )}
        </section>
    )
}
