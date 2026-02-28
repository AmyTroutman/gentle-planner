import { useState } from 'react'
import type { DayTracker } from './calendar.types'

type Props = {
    tracker: DayTracker
    onChange: (updated: DayTracker) => void
}

const defaultTracker: DayTracker = {
    period: false,
    symptoms: [],
    medications: false,
}

export default function TrackerAside({ tracker, onChange }: Props) {
    const t = { ...defaultTracker, ...tracker }
    const [symptomText, setSymptomText] = useState('')

    function update(patch: Partial<DayTracker>) {
        onChange({ ...t, ...patch })
    }

    function addSymptom() {
        const val = symptomText.trim()
        if (!val) return
        update({ symptoms: [...t.symptoms, val] })
        setSymptomText('')
    }

    function removeSymptom(i: number) {
        update({ symptoms: t.symptoms.filter((_, idx) => idx !== i) })
    }

    const tagStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.25rem 0.55rem',
        borderRadius: 20,
        fontSize: '0.85rem',
        background: '#f3f4f6',
        border: '1px solid #d1d5db',
    }

    const removeBtn: React.CSSProperties = {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: '#9ca3af',
        fontSize: '0.8rem',
        padding: 0,
        lineHeight: 1,
    }

    const inputRow: React.CSSProperties = {
        display: 'flex',
        gap: '0.35rem',
    }

    const input: React.CSSProperties = {
        flex: 1,
        padding: '0.5rem 0.65rem',
        borderRadius: 10,
        border: '1px solid #d1d5db',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
    }

    const addBtn: React.CSSProperties = {
        padding: '0.5rem 0.75rem',
        borderRadius: 10,
        border: '1px solid #d1d5db',
        background: 'white',
        cursor: 'pointer',
        fontSize: '0.9rem',
    }

    return (
        <section style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Trackers</h3>


            {/* Medications */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem' }}>Medications</strong>
                <button
                    onClick={() => update({ medications: !t.medications })}
                    style={{
                        padding: '0.35rem 0.9rem',
                        borderRadius: 20,
                        border: `1px solid ${t.medications ? '#1897be' : '#d1d5db'}`,
                        background: t.medications ? '#fdf2f8' : 'white',
                        color: t.medications ? '#1897be' : 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: t.medications ? 600 : 400,
                    }}
                >
                    {t.medications ? '● Yes' : '○ No'}
                </button>
            </div>
           
            {/* Weight */}
            <div style={{ display: 'grid', gap: '0.35rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Weight</strong>
                <input
                    type="number"
                    step="0.1"
                    placeholder="lbs"
                    value={t.weight ?? ''}
                    onChange={(e) => {
                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value)
                        update({ weight: val })
                    }}
                    style={{ ...input, width: '100%', boxSizing: 'border-box' }}
                />
            </div>

            {/* Anxiety */}
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>
                    Anxiety{t.anxiety != null ? ` — ${t.anxiety}/5` : ''}
                </strong>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            onClick={() => update({ anxiety: t.anxiety === n ? undefined : n })}
                            style={{
                                flex: 1,
                                padding: '0.4rem 0',
                                borderRadius: 8,
                                border: '1px solid',
                                borderColor: t.anxiety === n ? '#6366f1' : '#d1d5db',
                                background: t.anxiety === n ? '#eef2ff' : 'white',
                                color: t.anxiety === n ? '#4f46e5' : 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: t.anxiety === n ? 700 : 400,
                            }}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>

            {/* Symptoms */}
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Symptoms</strong>
                {t.symptoms.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {t.symptoms.map((s, i) => (
                            <span key={i} style={tagStyle}>
                                {s}
                                <button style={removeBtn} onClick={() => removeSymptom(i)}>✕</button>
                            </span>
                        ))}
                    </div>
                )}
                <div style={inputRow}>
                    <input
                        value={symptomText}
                        onChange={(e) => setSymptomText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addSymptom() }}
                        placeholder="Add symptom…"
                        style={input}
                    />
                    <button onClick={addSymptom} style={addBtn}>Add</button>
                </div>
            </div>

            {/* Period toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem' }}>Period</strong>
                <button
                    onClick={() => update({ period: !t.period })}
                    style={{
                        padding: '0.35rem 0.9rem',
                        borderRadius: 20,
                        border: `1px solid ${t.period ? '#be185d' : '#d1d5db'}`,
                        background: t.period ? '#fdf2f8' : 'white',
                        color: t.period ? '#be185d' : 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: t.period ? 600 : 400,
                    }}
                >
                    {t.period ? '● Yes' : '○ No'}
                </button>
            </div>

        </section>
    )
}