import { motion } from 'framer-motion'

type Props = {
    dailyAffirmation: string
    onConfirm: () => void
    onRefresh: () => void
}

export default function AffirmationStep({ dailyAffirmation, onConfirm, onRefresh }: Props) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'grid', gap: '1.25rem' }}
        >
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <p style={{ margin: 0, color: 'var(--muted)' }}>Remember,</p>

                <h2 style={{ margin: 0, lineHeight: 1.3, fontWeight: 500 }}>
                    “{dailyAffirmation}”
                </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={onConfirm}
                    style={{
                        width: 'fit-content',
                        padding: '0.7rem 1rem',
                        borderRadius: 12,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        fontSize: '1rem',
                    }}
                >
                    That’s right!
                </button>

                <button
                    onClick={onRefresh}
                    style={{
                        width: 'fit-content',
                        padding: '0.7rem 1rem',
                        borderRadius: 12,
                        border: '1px solid #d1d5db',
                        background: 'transparent',
                        fontSize: '1rem',
                        color: 'var(--muted)',
                    }}
                >
                    Give me another
                </button>
            </div>

        </motion.section>
    )
}
