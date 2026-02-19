/**
 * MigrateToFirestore
 *
 * Temporary one-time utility. Drop this into App.tsx, run it once to copy
 * your existing localStorage data into Firestore, then delete it.
 *
 * Usage in App.tsx:
 *   import MigrateToFirestore from '../features/migrate/MigrateToFirestore'
 *   export default function App() {
 *     return <MigrateToFirestore />
 *   }
 *
 * After migration is confirmed in the Firebase console, revert App.tsx back
 * to <MorningFlow /> and delete this file.
 */

import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

const USER_ID = 'me'

const KEYS = [
    'gentlePlanner.weeks',
    'gentlePlanner.mealsByDay',
    'gentlePlanner.tasksByDay',
] as const

const FIRESTORE_KEY_MAP: Record<string, string> = {
    'gentlePlanner.weeks': 'weeks',
    'gentlePlanner.mealsByDay': 'mealsByDay',
    'gentlePlanner.tasksByDay': 'tasksByDay',
}

export default function MigrateToFirestore() {
    const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
    const [log, setLog] = useState<string[]>([])

    function appendLog(msg: string) {
        setLog((prev) => [...prev, msg])
    }

    async function migrate() {
        setStatus('running')
        setLog([])

        for (const lsKey of KEYS) {
            const firestoreKey = FIRESTORE_KEY_MAP[lsKey]
            const raw = localStorage.getItem(lsKey)

            if (!raw) {
                appendLog(`⚠️  ${lsKey}: nothing in localStorage, skipping.`)
                continue
            }

            try {
                const value = JSON.parse(raw)
                const ref = doc(db, 'plannerData', USER_ID, 'keys', firestoreKey)
                await setDoc(ref, { value })
                appendLog(`✅  ${lsKey} → Firestore "${firestoreKey}" (${raw.length} chars)`)
            } catch (err) {
                appendLog(`❌  ${lsKey}: failed — ${String(err)}`)
                setStatus('error')
                return
            }
        }

        appendLog('🎉 Migration complete! Check your Firebase console to confirm.')
        setStatus('done')
    }

    return (
        <main style={{ padding: '3rem', maxWidth: 600, fontFamily: 'monospace' }}>
            <h2>Migrate localStorage → Firestore</h2>
            <p style={{ color: '#666' }}>
                This will copy your existing app data from this browser's localStorage into
                Firestore. Run this once from the device that has your data. After confirming
                in the Firebase console, revert App.tsx back to{' '}
                <code>&lt;MorningFlow /&gt;</code> and delete this file.
            </p>

            <button
                onClick={migrate}
                disabled={status === 'running' || status === 'done'}
                style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    background: status === 'done' ? '#d1fae5' : 'white',
                    cursor: status === 'running' || status === 'done' ? 'default' : 'pointer',
                    fontSize: '1rem',
                }}
            >
                {status === 'idle' && 'Run Migration'}
                {status === 'running' && 'Migrating...'}
                {status === 'done' && 'Done ✓'}
                {status === 'error' && 'Retry Migration'}
            </button>

            {log.length > 0 && (
                <ul style={{ marginTop: '1.5rem', listStyle: 'none', padding: 0, display: 'grid', gap: '0.4rem' }}>
                    {log.map((line, i) => (
                        <li key={i} style={{ fontSize: '0.9rem' }}>{line}</li>
                    ))}
                </ul>
            )}
        </main>
    )
}