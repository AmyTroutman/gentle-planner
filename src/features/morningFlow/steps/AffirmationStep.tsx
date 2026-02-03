import { useState } from 'react'
import TypingText from '../../../components/TypingText'

type Props = {
    dailyAffirmation: string
    onConfirm: () => void
    onRefresh: () => void
}

export default function AffirmationStep({
    dailyAffirmation,
    onConfirm,
    onRefresh,
}: Props) {
    const [introDone, setIntroDone] = useState(false)
    const [affirmationDone, setAffirmationDone] = useState(false)

    return (
        <section style={{ display: 'grid', gap: '1rem' }}>
            <TypingText
                text="Remember,"
                speed={55}
                onComplete={() => setIntroDone(true)}
            />

            {introDone && (
                <TypingText
                    text={`“${dailyAffirmation}”`}
                    speed={45}
                    onComplete={() => setAffirmationDone(true)}
                />
            )}

            {affirmationDone && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.7rem 1rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}
                    >
                        That’s right!
                    </button>

                    <button
                        onClick={onRefresh}
                        style={{
                            padding: '0.7rem 1rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'transparent',
                            color: 'var(--muted)',
                        }}
                    >
                        Give me another
                    </button>
                </div>
            )}
        </section>
    )
}
