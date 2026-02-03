import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import TypingText from '../../../components/TypingText'


type DrinkChoice = 'caf' | 'decaf' | 'tea' | 'none'

type Props = {
    options: string[]
    onSubmit: (payload: { breakfast: string; drink: DrinkChoice }) => void
}

export default function BreakfastStep({ options, onSubmit }: Props) {
    const [selectedBreakfast, setSelectedBreakfast] = useState<string | null>(null)
    const [customBreakfast, setCustomBreakfast] = useState('')
    const [drink, setDrink] = useState<DrinkChoice>('none')
    const [promptDone, setPromptDone] = useState(false)

    const breakfastValue = useMemo(() => {
        if (selectedBreakfast === '__custom__') return customBreakfast.trim()
        return selectedBreakfast ?? ''
    }, [selectedBreakfast, customBreakfast])

    const canSubmit = breakfastValue.trim().length > 0

    function submit() {
        if (!canSubmit) return
        onSubmit({ breakfast: breakfastValue.trim(), drink })
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'grid', gap: '1.25rem' }}
        >
            {/* Prompt */}
            <div style={{ display: 'grid', gap: '0.6rem' }}>
                <TypingText
                    text="What sounds good today?"
                    speed={55}
                    onComplete={() => setPromptDone(true)}
                />
            </div>

            {/* Everything else waits until typing is done */}
            {promptDone && (
                <>
                    {/* Breakfast options */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {options.map((opt) => {
                            const isOn = selectedBreakfast === opt
                            return (
                                <button
                                    key={opt}
                                    onClick={() => setSelectedBreakfast(opt)}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: 999,
                                        border: '1px solid #d1d5db',
                                        background: isOn ? '#111827' : 'white',
                                        color: isOn ? 'white' : 'var(--text)',
                                    }}
                                >
                                    {opt}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => setSelectedBreakfast('__custom__')}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 999,
                                border: '1px solid #d1d5db',
                                background: selectedBreakfast === '__custom__' ? '#111827' : 'white',
                                color: selectedBreakfast === '__custom__' ? 'white' : 'var(--text)',
                            }}
                        >
                            Something else
                        </button>
                    </div>

                    {selectedBreakfast === '__custom__' && (
                        <input
                            value={customBreakfast}
                            onChange={(e) => setCustomBreakfast(e.target.value)}
                            placeholder="Type your breakfast..."
                            style={{
                                width: '100%',
                                padding: '0.7rem 0.75rem',
                                borderRadius: 12,
                                border: '1px solid #d1d5db',
                                fontSize: '1rem',
                            }}
                        />
                    )}

                    {/* Drink choices */}
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>
                            Would you like caf, decaf, or tea with that?
                        </h3>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {(['caf', 'decaf', 'tea', 'none'] as const).map((d) => {
                                const isOn = drink === d
                                const label =
                                    d === 'caf'
                                        ? 'Caf'
                                        : d === 'decaf'
                                            ? 'Decaf'
                                            : d === 'tea'
                                                ? 'Tea'
                                                : 'Nothing today'

                                return (
                                    <button
                                        key={d}
                                        onClick={() => setDrink(d)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 999,
                                            border: '1px solid #d1d5db',
                                            background: isOn ? '#111827' : 'white',
                                            color: isOn ? 'white' : 'var(--text)',
                                        }}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={submit}
                        disabled={!canSubmit}
                        style={{
                            width: 'fit-content',
                            padding: '0.7rem 1rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                            fontSize: '1rem',
                            opacity: canSubmit ? 1 : 0.6,
                        }}
                    >
                        nom nom nom
                    </button>
                </>
            )}
        </motion.section>
    )

}
