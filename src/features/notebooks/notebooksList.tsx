import { useState } from 'react'
import type { Notebook } from './notebooks.types'

type Props = {
    notebooks: Notebook[]
    onOpen: (id: string) => void
    onCreate: (title: string, emoji: string) => void
    onDelete: (id: string) => void
}

const EMOJI_OPTIONS = ['📓', '🎮', '🍳', '✈️', '💡', '🌱', '📚', '🎨', '🏋️', '🛠️', '🎵', '⭐']

// A set of warm, saturated spine colors
const SPINE_COLORS = [
    '#4f6d7a', // slate blue
    '#7c6b9e', // muted purple
    '#a05c68', // dusty rose
    '#5b8a72', // sage green
    '#c4813a', // warm amber
    '#4a7fb5', // cornflower blue
    '#a07850', // tan/brown
    '#7a8a5a', // olive
    '#8a5a7a', // mauve
    '#5a7a8a', // teal
]

function getSpineColor(index: number) {
    return SPINE_COLORS[index % SPINE_COLORS.length]
}

// Lighten a hex color for the highlight strip
function lighten(hex: string, amount = 40): string {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount)
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount)
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount)
    return `rgb(${r},${g},${b})`
}

function NotebookSpine({
    notebook,
    index,
    onOpen,
    onDelete,
}: {
    notebook: Notebook
    index: number
    onOpen: () => void
    onDelete: () => void
}) {
    const [hovered, setHovered] = useState(false)
    const spineColor = getSpineColor(index)
    const highlightColor = lighten(spineColor, 30)

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                width: 72,
                height: 180,
                cursor: 'pointer',
                transform: hovered ? 'translateY(-10px)' : 'translateY(0)',
                transition: 'transform 0.18s ease',
                flexShrink: 0,
            }}
            onClick={onOpen}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={notebook.title}
        >
            {/* Delete button — only on hover */}
            {hovered && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete "${notebook.title}"?`)) onDelete()
                    }}
                    style={{
                        position: 'absolute',
                        top: -10,
                        right: -6,
                        zIndex: 10,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: 'none',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        padding: 0,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                >
                    ✕
                </button>
            )}

            {/* Book body */}
            <div
                style={{
                    flex: 1,
                    borderRadius: '3px 6px 6px 3px',
                    background: spineColor,
                    boxShadow: hovered
                        ? `3px 6px 16px rgba(0,0,0,0.35), inset -4px 0 8px rgba(0,0,0,0.15)`
                        : `2px 4px 10px rgba(0,0,0,0.25), inset -3px 0 6px rgba(0,0,0,0.12)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 0 12px',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'box-shadow 0.18s ease',
                }}
            >
                {/* Left spine highlight */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    background: `linear-gradient(to right, ${highlightColor}, transparent)`,
                    borderRadius: '3px 0 0 3px',
                    opacity: 0.6,
                }} />

                {/* Page count indicator (little lines at top) */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 4,
                    height: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '0 6px 6px 0',
                }} />

                {/* Emoji */}
                <span style={{ fontSize: '1.5rem', lineHeight: 1, zIndex: 1 }}>
                    {notebook.emoji}
                </span>

                {/* Title — rotated */}
                <div
                    style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        maxHeight: 110,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                >
                    {notebook.title}
                </div>

                {/* Page count badge */}
                <div style={{
                    fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.6)',
                    zIndex: 1,
                    letterSpacing: '0.02em',
                }}>
                    {notebook.pages.length}p
                </div>
            </div>

            {/* Book bottom edge shadow */}
            <div style={{
                height: 6,
                background: `linear-gradient(to bottom, ${spineColor}, rgba(0,0,0,0.3))`,
                borderRadius: '0 0 4px 4px',
                opacity: 0.5,
            }} />
        </div>
    )
}

export default function NotebooksList({ notebooks, onOpen, onCreate, onDelete }: Props) {
    const [creating, setCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newEmoji, setNewEmoji] = useState('📓')

    function handleCreate() {
        const title = newTitle.trim()
        if (!title) return
        onCreate(title, newEmoji)
        setNewTitle('')
        setNewEmoji('📓')
        setCreating(false)
    }

    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* New notebook form */}
            {creating ? (
                <div style={{
                    padding: '1rem',
                    borderRadius: 14,
                    border: '1px solid #a5b4fc',
                    background: '#f5f3ff',
                    display: 'grid',
                    gap: '0.75rem',
                }}>
                    <strong style={{ fontSize: '0.95rem' }}>New notebook</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {EMOJI_OPTIONS.map((e) => (
                            <button
                                key={e}
                                onClick={() => setNewEmoji(e)}
                                style={{
                                    fontSize: '1.3rem',
                                    padding: '0.25rem 0.35rem',
                                    borderRadius: 8,
                                    border: newEmoji === e ? '2px solid #6366f1' : '2px solid transparent',
                                    background: newEmoji === e ? '#e0e7ff' : 'transparent',
                                    cursor: 'pointer',
                                    lineHeight: 1,
                                }}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                    <input
                        autoFocus
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate()
                            if (e.key === 'Escape') setCreating(false)
                        }}
                        placeholder="Notebook name..."
                        style={{
                            padding: '0.6rem 0.75rem',
                            borderRadius: 10,
                            border: '1px solid #d1d5db',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleCreate}
                            disabled={!newTitle.trim()}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 10,
                                border: 'none',
                                background: '#6366f1',
                                color: 'white',
                                cursor: newTitle.trim() ? 'pointer' : 'default',
                                opacity: newTitle.trim() ? 1 : 0.5,
                                fontSize: '0.9rem',
                            }}
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setCreating(false)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 10,
                                border: '1px solid #d1d5db',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setCreating(true)}
                    style={{
                        alignSelf: 'start',
                        padding: '0.5rem 1rem',
                        borderRadius: 10,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                    }}
                >
                    + New notebook
                </button>
            )}

            {/* Bookshelf */}
            {notebooks.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>
                    No notebooks yet. Create one to get started.
                </p>
            ) : (
                <div>
                    {/* Shelf */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '10px',
                            padding: '24px 20px 0',
                            flexWrap: 'wrap',
                            minHeight: 210,
                            background: 'linear-gradient(to bottom, #f8f5f0, #f0ebe3)',
                            borderRadius: '12px 12px 0 0',
                        }}
                    >
                        {notebooks.map((nb, i) => (
                            <NotebookSpine
                                key={nb.id}
                                notebook={nb}
                                index={i}
                                onOpen={() => onOpen(nb.id)}
                                onDelete={() => onDelete(nb.id)}
                            />
                        ))}
                    </div>
                    {/* Shelf plank */}
                    <div style={{
                        height: 14,
                        background: 'linear-gradient(to bottom, #c8a96e, #a07850)',
                        borderRadius: '0 0 6px 6px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    }} />
                </div>
            )}
        </div>
    )
}