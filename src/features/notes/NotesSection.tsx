import { useState, useEffect } from 'react'

type Props = {
    note: string
    onChange: (value: string) => void
}

export default function NotesSection({ note, onChange }: Props) {
    // Local state so keystrokes only update the textarea, not Firestore
    const [localNote, setLocalNote] = useState(note)

    // Sync if the parent value changes (e.g. switching days in History)
    useEffect(() => {
        setLocalNote(note)
    }, [note])

    return (
        <textarea
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value)}
            onBlur={() => onChange(localNote)}
            placeholder="Jot something down..."
            rows={5}
            style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 12,
                border: '1px solid #d1d5db',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
            }}
        />
    )
}