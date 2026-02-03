import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type Props = {
    text: string
    speed?: number
    onComplete?: () => void
}

export default function TypingText({ text, speed = 60, onComplete }: Props) {
    const [displayed, setDisplayed] = useState('')
    const onCompleteRef = useRef<Props['onComplete']>(onComplete)

    // Always keep the newest callback available
    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    // Only re-type when the text or speed changes
    useEffect(() => {
        let i = 0
        setDisplayed('')

        const interval = setInterval(() => {
            i++
            setDisplayed(text.slice(0, i))

            if (i >= text.length) {
                clearInterval(interval)
                onCompleteRef.current?.()
            }
        }, speed)

        return () => clearInterval(interval)
    }, [text, speed])

    return (
        <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontSize: '2.25rem', fontWeight: 500, margin: 0 }}
        >
            {displayed}
        </motion.h1>
    )
}
