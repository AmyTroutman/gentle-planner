type Props = {
    note: string
    onChange: (value: string) => void
}

export default function NotesSection({ note, onChange }: Props) {
    return (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
            <textarea
                value={note}
                onChange={(e) => onChange(e.target.value)}
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
        </div>
    )
}