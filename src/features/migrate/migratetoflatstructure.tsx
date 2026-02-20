/**
 * MigrateToFlatStructure
 *
 * One-time utility to move data from:
 *   plannerData/me/keys/{weeks, mealsByDay, tasksByDay}
 * into the new flat structure:
 *   users/me  →  { weeks, mealsByDay, tasksByDay }
 *
 * Usage in App.tsx:
 *   import MigrateToFlatStructure from '../features/migrate/MigrateToFlatStructure'
 *   export default function App() {
 *     return <MigrateToFlatStructure />
 *   }
 *
 * After confirming the data looks correct in the Firebase console under
 * users/me, revert App.tsx back to <MorningFlow /> and delete this file.
 * You can also manually delete the old plannerData collection from the
 * Firebase console once you're satisfied.
 */

import { useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

const OLD_KEYS = ['weeks', 'mealsByDay', 'tasksByDay'] as const

export default function MigrateToFlatStructure() {
    const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
    const [log, setLog] = useState<string[]>([])

    function appendLog(msg: string) {
        setLog((prev) => [...prev, msg])
    }

    async function migrate() {
        setStatus('running')
        setLog([])

        const newDocData: Record<string, unknown> = {}

        // Read each field from the old subcollection
        for (const key of OLD_KEYS) {
            const oldRef = doc(db, 'plannerData', 'me', 'keys', key)
            const snap = await getDoc(oldRef)

            if (!snap.exists()) {
                appendLog(`⚠️  "${key}": not found in old structure, will use empty default.`)
                newDocData[key] = {}
            } else {
                newDocData[key] = snap.data().value
                const size = JSON.stringify(snap.data().value).length
                appendLog(`✅  "${key}": read ${size} chars from plannerData/me/keys/${key}`)
            }
        }

        // Write everything into the new flat users/me document
        try {
            const newRef = doc(db, 'users', 'me')
            await setDoc(newRef, newDocData)
            appendLog('✅  Written to users/me successfully.')
            appendLog('')
            appendLog('🎉 Migration complete!')
            appendLog('   → Check users/me in the Firebase console to confirm your data.')
            appendLog('   → Then revert App.tsx to <MorningFlow /> and delete this file.')
            appendLog('   → You can delete the plannerData collection from Firebase console when ready.')
            setStatus('done')
        } catch (err) {
            appendLog(`❌  Failed to write users/me: ${String(err)}`)
            setStatus('error')
        }
    }

    return (
        <main style={{ padding: '3rem', maxWidth: 600, fontFamily: 'monospace' }}>
            <h2>Migrate to flat Firestore structure</h2>
            <p style={{ color: '#666', fontFamily: 'sans-serif' }}>
                This reads your data from{' '}
                 and writes it
                into the new <code>users/me</code> document. Your old data is not deleted — you
                can remove it manually once you've confirmed everything looks good.
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
                        <li key={i} style={{ fontSize: '0.9rem', whiteSpace: 'pre' }}>{line}</li>
                    ))}
                </ul>
            )}
        </main>
    )
}