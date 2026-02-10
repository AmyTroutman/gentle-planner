import { useState } from 'react'
import TypingText from '../../../components/TypingText'
import { motion } from 'framer-motion'

type Props = {
    meaningful?: string
    askedALot?: string
    onSave: (meaningful: string, askedALot: string) => void
    onNext: () => void
    onSkip: () => void
}

export default function LookbackStep({ meaningful, askedALot, onSave, onNext, onSkip }: Props) {
    const [m, setM] = useState(meaningful ?? '')
    const [h, setH] = useState(askedALot ?? '')
    const [typingDone, setTypingDone] = useState(false)
    const handleTypingComplete = () => setTypingDone(true)

    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'grid', gap: '1.25rem' }}
        >
            <TypingText text="Looking back" speed={45} onComplete={handleTypingComplete} />

            {typingDone && (
                <>

                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                        <span>What felt meaningful?</span>
                        <textarea value={m} onChange={(e) => setM(e.target.value)} rows={4} />
                    </label>

                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                        <span>What asked a lot from you?</span>
                        <textarea value={h} onChange={(e) => setH(e.target.value)} rows={4} />
                    </label>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => {
                                onSave(m, h)
                                onNext()
                            }}>
                            Next
                        </button>
                        <button onClick={onSkip}>Skip</button>
                    </div>
                </>
            )}
        </motion.section>
    )
}
