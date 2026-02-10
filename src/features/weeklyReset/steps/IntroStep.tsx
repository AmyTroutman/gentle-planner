import { useState } from 'react'
import TypingText from '../../../components/TypingText'
import { motion } from 'framer-motion'

type Props = {
    onBegin: () => void
    onLater: () => void
    onSkipWeek: () => void
}

export default function IntroStep({ onBegin, onLater, onSkipWeek }: Props) {
    const [typingDone, setTypingDone] = useState(false)
    const handleTypingComplete = () => setTypingDone(true)

    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'grid', gap: '1.25rem' }}
        >
            <TypingText text="A new week is here." speed={45} onComplete={handleTypingComplete} />

            {typingDone && (
                <>
                    <p style={{ margin: 0, color: 'var(--muted)' }}>
                        Would you like to take a moment to close the last one and step forward?
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}
                            onClick={onBegin}>Begin</button>
                        <button style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}
                            onClick={onLater}>Later</button>
                        <button style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}
                            onClick={onSkipWeek}>Skip this week</button>
                    </div>
                </>
            )}
        </motion.section>
    )
}
