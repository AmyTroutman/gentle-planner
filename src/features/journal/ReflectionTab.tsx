import { useState, useEffect } from 'react'

type Props = {
    reflection: string
    weeklyTheme: string
    onChange: (value: string) => void
}

export default function ReflectionTab({ reflection, weeklyTheme, onChange }: Props) {
    const [local, setLocal] = useState(reflection)

    useEffect(() => {
        setLocal(reflection)
    }, [reflection])

    return (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                What does <span style={{ fontStyle: 'italic' }}>"{weeklyTheme}"</span> look like in everyday life?
            </p>
            <textarea
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onBlur={() => onChange(local)}
                placeholder={`Reflect on "${weeklyTheme}"...`}
                rows={8}
            />
        </div>
    )
}