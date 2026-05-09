import { useState } from 'react'
import { motion } from 'framer-motion'
import TypingText from '../../../components/TypingText'

type DrinkChoice = 'caf' | 'decaf' | 'tea' | 'none'

type Props = {
    options: string[]
    onUpdateOptions: (options: string[]) => void
    onSubmit: (payload: { breakfast: string; drink: DrinkChoice }) => void
}

const smallBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0 0.2rem',
    fontSize: '0.82rem',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
}

const chip = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 0.75rem',
    borderRadius: 999,
    border: '1px solid #d1d5db',
    background: active ? '#111827' : 'white',
    color: active ? 'white' : 'var(--text)',
    cursor: 'pointer',
    fontSize: '0.9rem',
})

export default function BreakfastStep({ options, onUpdateOptions, onSubmit }: Props) {
    const [localOptions, setLocalOptions] = useState<string[]>(() => options)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [showCustom, setShowCustom] = useState(false)
    const [customBreakfast, setCustomBreakfast] = useState('')
    const [drink, setDrink] = useState<DrinkChoice>('caf')
    const [promptDone, setPromptDone] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editingOpt, setEditingOpt] = useState<string | null>(null)
    const [editingText, setEditingText] = useState('')

    const nothingSelected = selected.has('__nothing__')
    const customValue = customBreakfast.trim()
    const canSubmit = selected.size > 0 || (showCustom && customValue.length > 0)

    function updateOptions(next: string[]) {
        setLocalOptions(next)
        onUpdateOptions(next)
    }

    function toggleChip(opt: string) {
        setSelected(prev => {
            const next = new Set(prev)
            next.delete('__nothing__')
            if (next.has(opt)) next.delete(opt)
            else next.add(opt)
            return next
        })
    }

    function selectNothing() {
        setSelected(new Set(['__nothing__']))
        setShowCustom(false)
        setCustomBreakfast('')
    }

    function deleteOption(opt: string) {
        updateOptions(localOptions.filter(o => o !== opt))
        setSelected(prev => { const n = new Set(prev); n.delete(opt); return n })
    }

    function startEdit(opt: string) {
        setEditingOpt(opt)
        setEditingText(opt)
    }

    function confirmEdit() {
        if (!editingOpt) return
        const newText = editingText.trim()
        if (!newText || newText === editingOpt) { setEditingOpt(null); return }
        updateOptions(localOptions.map(o => o === editingOpt ? newText : o))
        setSelected(prev => {
            if (!prev.has(editingOpt)) return prev
            const n = new Set(prev); n.delete(editingOpt); n.add(newText); return n
        })
        setEditingOpt(null)
    }

    function submit() {
        if (!canSubmit) return
        let breakfastValue: string
        if (nothingSelected) {
            breakfastValue = 'Nothing'
        } else {
            const parts = [...selected]
            if (showCustom && customValue) {
                parts.push(customValue)
                if (!localOptions.some(o => o.toLowerCase() === customValue.toLowerCase())) {
                    updateOptions([...localOptions, customValue])
                }
            }
            breakfastValue = parts.join(', ')
        }
        onSubmit({ breakfast: breakfastValue, drink })
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'grid', gap: '1.25rem' }}
        >
            <TypingText text="What sounds good today?" speed={55} onComplete={() => setPromptDone(true)} />

            {promptDone && (
                <>
                    {/* Options */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                        {editMode
                            ? localOptions.map(opt => {
                                if (editingOpt === opt) {
                                    return (
                                        <div key={opt} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                            <input
                                                autoFocus
                                                value={editingText}
                                                onChange={e => setEditingText(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditingOpt(null) }}
                                                style={{ padding: '0.4rem 0.65rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                            />
                                            <button onClick={confirmEdit} style={{ ...smallBtn, color: '#16a34a' }}>✓</button>
                                            <button onClick={() => setEditingOpt(null)} style={{ ...smallBtn, color: 'var(--muted)' }}>✕</button>
                                        </div>
                                    )
                                }
                                return (
                                    <div key={opt} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        padding: '0.4rem 0.65rem', borderRadius: 999,
                                        border: '1px solid #d1d5db', background: 'white',
                                    }}>
                                        <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                                        <button onClick={() => startEdit(opt)} style={{ ...smallBtn, color: '#6b7280' }} title="Rename">✏️</button>
                                        <button onClick={() => deleteOption(opt)} style={{ ...smallBtn, color: '#ef4444' }} title="Remove">✕</button>
                                    </div>
                                )
                            })
                            : localOptions.map(opt => (
                                <button key={opt} onClick={() => toggleChip(opt)} style={chip(selected.has(opt) && !nothingSelected)}>
                                    {opt}
                                </button>
                            ))
                        }

                        {!editMode && (
                            <>
                                <button
                                    onClick={() => { setShowCustom(s => !s); setSelected(prev => { const n = new Set(prev); n.delete('__nothing__'); return n }) }}
                                    style={chip(showCustom && !nothingSelected)}
                                >
                                    Something else
                                </button>
                                <button onClick={selectNothing} style={chip(nothingSelected)}>
                                    Nothing
                                </button>
                            </>
                        )}
                    </div>

                    {/* Edit list toggle */}
                    <button
                        onClick={() => { setEditMode(e => !e); setEditingOpt(null) }}
                        style={{ alignSelf: 'start', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                    >
                        {editMode ? 'Done editing' : 'Edit list'}
                    </button>

                    {/* Custom write-in */}
                    {!editMode && showCustom && (
                        <input
                            autoFocus
                            value={customBreakfast}
                            onChange={e => setCustomBreakfast(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') submit() }}
                            placeholder="Type your breakfast..."
                            style={{ padding: '0.7rem 0.75rem', borderRadius: 12, border: '1px solid #d1d5db', fontSize: '1rem', fontFamily: 'inherit' }}
                        />
                    )}

                    {/* Drink */}
                    {!editMode && (
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>
                                Would you like caf, decaf, or tea with that?
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {(['caf', 'decaf', 'tea', 'none'] as const).map(d => (
                                    <button key={d} onClick={() => setDrink(d)} style={chip(drink === d)}>
                                        {d === 'caf' ? 'Caf' : d === 'decaf' ? 'Decaf' : d === 'tea' ? 'Tea' : 'Nothing today'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    {!editMode && (
                        <button onClick={submit} disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : 0.6 }}>
                            nom nom nom
                        </button>
                    )}
                </>
            )}
        </motion.section>
    )
}
