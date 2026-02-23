import { useState, useEffect } from 'react'

type Props = {
    journal: string
    onChange: (value: string) => void
}

export default function JournalTab({ journal, onChange }: Props) {
    const [local, setLocal] = useState(journal)

    useEffect(() => {
        setLocal(journal)
    }, [journal])

    return (
        <textarea
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => onChange(local)}
            placeholder="What's on your mind..."
            rows={14}
        />
    )
}