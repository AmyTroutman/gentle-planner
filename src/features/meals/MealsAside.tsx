import { useState } from 'react'
import type { DailyMeals } from './meals.types'

type Props = {
    meals: DailyMeals
    onSetMeal: (type: 'breakfast' | 'lunch' | 'dinner', text: string) => void
    onClearMeal: (type: 'breakfast' | 'lunch' | 'dinner') => void

    onAddSnack: (text: string) => void
    onDeleteSnack: (id: string) => void

    onAddDrink: (text: string) => void
    onDeleteDrink: (id: string) => void
}


function Row({
    label,
    value,
    onSave,
    onClear,
}: {
    label: string
    value?: string
    onSave: (text: string) => void
    onClear: () => void
}) {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(value ?? '')

    return (
        <div style={{ display: 'grid', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '0.95rem' }}>{label}</strong>
                {value && !editing && (
                    <button
                        onClick={onClear}
                        style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {!editing ? (
                <button
                    onClick={() => {
                        setText(value ?? '')
                        setEditing(true)
                    }}
                    style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.7rem',
                        borderRadius: 12,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        color: value ? 'var(--text)' : 'var(--muted)',
                    }}
                >
                    {value ? value : 'Add…'}
                </button>
            ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type…"
                        style={{
                            width: '100%',
                            padding: '0.6rem 0.7rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => {
                                const cleaned = text.trim()
                                if (cleaned) onSave(cleaned)
                                setEditing(false)
                            }}
                            style={{
                                padding: '0.5rem 0.7rem',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                background: 'white',
                            }}
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            style={{
                                padding: '0.5rem 0.7rem',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                background: 'transparent',
                                color: 'var(--muted)',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function MealsAside({
    meals,
    onSetMeal,
    onClearMeal,
    onAddSnack,
    onDeleteSnack,
    onAddDrink,
    onDeleteDrink
}: Props) {
    const [snackText, setSnackText] = useState('')
    const [drinkText, setDrinkText] = useState('')

    return (
        <section style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Meals</h3>

            <Row
                label="Breakfast"
                value={meals.breakfast}
                onSave={(t) => onSetMeal('breakfast', t)}
                onClear={() => onClearMeal('breakfast')}
            />

            <Row
                label="Lunch"
                value={meals.lunch}
                onSave={(t) => onSetMeal('lunch', t)}
                onClear={() => onClearMeal('lunch')}
            />

            <Row
                label="Dinner"
                value={meals.dinner}
                onSave={(t) => onSetMeal('dinner', t)}
                onClear={() => onClearMeal('dinner')}
            />

            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Snacks</strong>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        value={snackText}
                        onChange={(e) => setSnackText(e.target.value)}
                        placeholder="Add a snack…"
                        style={{
                            flex: 1,
                            padding: '0.6rem 0.7rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const cleaned = snackText.trim()
                                if (!cleaned) return
                                onAddSnack(cleaned)
                                setSnackText('')
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            const cleaned = snackText.trim()
                            if (!cleaned) return
                            onAddSnack(cleaned)
                            setSnackText('')
                        }}
                        style={{
                            padding: '0.6rem 0.75rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}
                    >
                        Add
                    </button>
                </div>

                {meals.snacks.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--muted)' }}>No snacks logged.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
                        {meals.snacks.map((s) => (
                            <li
                                key={s.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                    padding: '0.55rem 0.65rem',
                                    borderRadius: 12,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                }}
                            >
                                <span style={{ fontSize: '0.95rem' }}>{s.text}</span>
                                <button
                                    onClick={() => onDeleteSnack(s.id)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Drinks</strong>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        value={drinkText}
                        onChange={(e) => setDrinkText(e.target.value)}
                        placeholder="Add a drink…"
                        style={{
                            flex: 1,
                            padding: '0.6rem 0.7rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const cleaned = drinkText.trim()
                                if (!cleaned) return
                                onAddDrink(cleaned)
                                setDrinkText('')
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            const cleaned = drinkText.trim()
                            if (!cleaned) return
                            onAddDrink(cleaned)
                            setDrinkText('')
                        }}
                        style={{
                            padding: '0.6rem 0.75rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}
                    >
                        Add
                    </button>
                </div>

                {meals.drinks.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--muted)' }}>No drinks logged.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
                        {meals.drinks.map((d) => (
                            <li
                                key={d.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                    padding: '0.55rem 0.65rem',
                                    borderRadius: 12,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                }}
                            >
                                <span style={{ fontSize: '0.95rem' }}>{d.text}</span>
                                <button
                                    onClick={() => onDeleteDrink(d.id)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    )
}
