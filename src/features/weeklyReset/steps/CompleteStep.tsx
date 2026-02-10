import { useState } from 'react'
import TypingText from '../../../components/TypingText'
import { motion } from 'framer-motion'

type Props = {
    onDone: () => void
}

export default function CompleteStep({ onDone }: Props) {
    const [typingDone, setTypingDone] = useState(false)
    const handleTypingComplete = () => setTypingDone(true)

    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'grid', gap: '1.25rem' }}
        >
            <TypingText text="From here, we begin again." speed={45} onComplete={handleTypingComplete} />

            {typingDone && (
                <>
                    <button onClick={onDone}
                        style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}>Back to dashboard</button>
                </>
            )}
        </motion.section>
    )
}
