import { useState } from 'react'
import TypingText from '../../../components/TypingText'
import { motion } from 'framer-motion'

type Props = {
    pausePrompt?: string
    theme?: string
    inspiration?: string
    behavior?: string
    onSave: (patch: { pausePrompt: string; theme: string; inspiration: string; behavior: string }) => void
    onNext: () => void
    onSkip: () => void
}

export default function ThemeStep({ pausePrompt, theme, inspiration, behavior, onSave, onNext, onSkip }: Props) {
    const [p, setP] = useState(pausePrompt ?? '')
    const [t, setT] = useState(theme ?? '')
    const [i, setI] = useState(inspiration ?? '')
    const [b, setB] = useState(behavior ?? '')

    const [typingDone, setTypingDone] = useState(false)
    const handleTypingComplete = () => setTypingDone(true)

    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'grid', gap: '1.25rem' }}
        >
            <TypingText text="Turning toward the week" speed={45} onComplete={handleTypingComplete} />

            {typingDone && (
                <>

                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                        <span>What did you see, read, or hear that made you pause?</span>
                        <textarea value={p} onChange={(e) => setP(e.target.value)} rows={3} />
                    </label>

                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                        <span>What feels important to carry into this week?</span>
                        <input value={t} onChange={(e) => setT(e.target.value)} />
                    </label>

                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                        <span>What is this pointing you toward?</span>
                        <textarea value={i} onChange={(e) => setI(e.target.value)} rows={3} />
                    </label>

                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                        <span>One small way you might live this</span>
                        <input value={b} onChange={(e) => setB(e.target.value)} />
                    </label>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => {
                                onSave({ pausePrompt: p, theme: t, inspiration: i, behavior: b })
                                onNext()
                            }} >
                            Finish
                        </button>
                        <button onClick={onSkip}
                        >Skip</button>
                    </div>
                </>
            )}
        </motion.section>
    )
}
