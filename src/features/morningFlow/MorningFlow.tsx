import { useState } from 'react'
import type { MorningStep } from './morningFlow.types'

export default function MorningFlow() {
    const [step, setStep] = useState<MorningStep>('greeting')

    function next() {
        const order: MorningStep[] = [
            'greeting',
            'theme',
            'reflection',
            'affirmation',
            'breakfast',
            'drink',
            'transition',
        ]

        const currentIndex = order.indexOf(step)
        const nextStep = order[currentIndex + 1]

        if (nextStep) setStep(nextStep)
    }

    return (
        <main style={{ padding: '3rem', maxWidth: 600 }}>
            <h2>Current step: {step}</h2>
            <button onClick={next}>Next</button>
        </main>
    )
}
