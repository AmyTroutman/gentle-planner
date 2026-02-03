import { useEffect, useState } from 'react'
import TypingText from '../../../components/TypingText'

type Props = {
    onDone: () => void
}

export default function TransitionStep({ onDone }: Props) {
    const [line1Done, setLine1Done] = useState(false)
    const [line2Done, setLine2Done] = useState(false)

    // Auto-advance after both lines are typed
    useEffect(() => {
        if (line1Done && line2Done) {
            const t = setTimeout(onDone, 900)
            return () => clearTimeout(t)
        }
    }, [line1Done, line2Done, onDone])

    return (
        <section style={{ display: 'grid', gap: '0.5rem' }}>
            <TypingText
                text="Sounds good."
                speed={55}
                onComplete={() => setLine1Done(true)}
            />

            {line1Done && (
                <TypingText
                    text="Let’s start the day."
                    speed={55}
                    onComplete={() => setLine2Done(true)}
                />
            )}
        </section>
    )
}
