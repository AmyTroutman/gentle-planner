import { motion } from 'framer-motion'
import TypingText from '../../../components/TypingText'

type Props = {
    onDone: () => void
}

export default function GreetingStep({ onDone }: Props) {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2.2, duration: 0.8 }}
            onAnimationComplete={onDone}
        >
            <TypingText text="Good morning, Amy" />
        </motion.div>
    )
}
