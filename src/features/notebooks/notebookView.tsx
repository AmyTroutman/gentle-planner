import { useState } from 'react'
import type { Notebook, NotebookTag } from './notebooks.types'

type Props = {
    notebook: Notebook
    onBack: () => void
    onOpenPage: (pageId: string) => void
    onCreatePage: (title: string) => void
    onDeletePage: (pageId: string) => void
    onUpdateTags: (tags: NotebookTag[]) => void
}

const TAG_PALETTE = [
    '#fca5a5', '#fdba74', '#fcd34d', '#86efac',
    '#67e8f9', '#93c5fd', '#c4b5fd', '#f9a8d4',
    '#d1d5db', '#6ee7b7',
]

function tagTextColor(bg: string): string {
    // simple luminance check — light bg → dark text
    const hex = bg.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.55 ? '#374151' : '#fff'
}

export default function NotebookView({
    notebook,
    onBack,
    onOpenPage,
    onCreatePage,
    onDeletePage,
    onUpdateTags,
}: Props) {
    const [creatingPage, setCreatingPage] = useState(false)
    const [newPageTitle, setNewPageTitle] = useState('')
    const [filterTagId, setFilterTagId] = useState<string | null>(null)

    // Tag management
    const [managingTags, setManagingTags] = useState(false)
    const [newTagLabel, setNewTagLabel] = useState('')
    const [newTagColor, setNewTagColor] = useState(TAG_PALETTE[0])

    function handleCreatePage() {
        const title = newPageTitle.trim()
        if (!title) return
        onCreatePage(title)
        setNewPageTitle('')
        setCreatingPage(false)
    }

    function handleAddTag() {
        const label = newTagLabel.trim()
        if (!label) return
        const tag: NotebookTag = {
            id: crypto.randomUUID(),
            label,
            color: newTagColor,
        }
        onUpdateTags([...notebook.tags, tag])
        setNewTagLabel('')
        setNewTagColor(TAG_PALETTE[(notebook.tags.length + 1) % TAG_PALETTE.length])
    }

    function handleDeleteTag(tagId: string) {
        onUpdateTags(notebook.tags.filter((t) => t.id !== tagId))
        if (filterTagId === tagId) setFilterTagId(null)
    }

    const filteredPages = filterTagId
        ? notebook.pages.filter((p) => p.tagIds?.includes(filterTagId))
        : notebook.pages

    return (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '0.4rem 0.7rem',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            color: 'var(--muted)',
                        }}
                    >
                        ← Back
                    </button>
                    <h3 style={{ margin: 0 }}>{notebook.emoji} {notebook.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setManagingTags((v) => !v)}
                        style={{
                            padding: '0.5rem 0.9rem',
                            borderRadius: 10,
                            border: '1px solid #d1d5db',
                            background: managingTags ? '#f3f4f6' : 'white',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            color: 'var(--muted)',
                        }}
                    >
                        🏷 Tags
                    </button>
                    <button
                        onClick={() => setCreatingPage(true)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 10,
                            border: '1px solid #d1d5db',
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                        }}
                    >
                        + New page
                    </button>
                </div>
            </header>

            {/* Tag management panel */}
            {managingTags && (
                <div style={{
                    padding: '1rem',
                    borderRadius: 14,
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    display: 'grid',
                    gap: '0.75rem',
                }}>
                    <strong style={{ fontSize: '0.9rem' }}>Notebook tags</strong>

                    {/* Existing tags */}
                    {notebook.tags.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>No tags yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {notebook.tags.map((tag) => (
                                <div
                                    key={tag.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        padding: '0.2rem 0.5rem 0.2rem 0.6rem',
                                        borderRadius: 20,
                                        background: tag.color,
                                        color: tagTextColor(tag.color),
                                        fontSize: '0.82rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    {tag.label}
                                    <button
                                        onClick={() => handleDeleteTag(tag.id)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            color: 'inherit',
                                            opacity: 0.6,
                                            fontSize: '0.75rem',
                                            padding: '0 0.1rem',
                                            lineHeight: 1,
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new tag */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            value={newTagLabel}
                            onChange={(e) => setNewTagLabel(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag() }}
                            placeholder="New tag name..."
                            style={{
                                padding: '0.45rem 0.65rem',
                                borderRadius: 8,
                                border: '1px solid #d1d5db',
                                fontSize: '0.88rem',
                                fontFamily: 'inherit',
                                width: 150,
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {TAG_PALETTE.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewTagColor(color)}
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        background: color,
                                        border: newTagColor === color ? '2.5px solid #374151' : '2px solid transparent',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleAddTag}
                            disabled={!newTagLabel.trim()}
                            style={{
                                padding: '0.45rem 0.85rem',
                                borderRadius: 8,
                                border: 'none',
                                background: '#6366f1',
                                color: 'white',
                                cursor: newTagLabel.trim() ? 'pointer' : 'default',
                                opacity: newTagLabel.trim() ? 1 : 0.5,
                                fontSize: '0.88rem',
                            }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            {/* Tag filter row */}
            {notebook.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilterTagId(null)}
                        style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: 20,
                            border: filterTagId === null ? '1.5px solid #6366f1' : '1px solid #d1d5db',
                            background: filterTagId === null ? '#e0e7ff' : 'white',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: filterTagId === null ? 600 : 400,
                            color: filterTagId === null ? '#3730a3' : 'inherit',
                        }}
                    >
                        All
                    </button>
                    {notebook.tags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => setFilterTagId(filterTagId === tag.id ? null : tag.id)}
                            style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: 20,
                                border: filterTagId === tag.id ? `1.5px solid #6366f1` : '1px solid #d1d5db',
                                background: filterTagId === tag.id ? tag.color : 'white',
                                color: filterTagId === tag.id ? tagTextColor(tag.color) : 'inherit',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: filterTagId === tag.id ? 600 : 400,
                            }}
                        >
                            {tag.label}
                        </button>
                    ))}
                </div>
            )}

            {/* New page form */}
            {creatingPage && (
                <div style={{
                    padding: '1rem',
                    borderRadius: 14,
                    border: '1px solid #a5b4fc',
                    background: '#f5f3ff',
                    display: 'grid',
                    gap: '0.75rem',
                }}>
                    <strong style={{ fontSize: '0.95rem' }}>New page</strong>
                    <input
                        autoFocus
                        value={newPageTitle}
                        onChange={(e) => setNewPageTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePage(); if (e.key === 'Escape') setCreatingPage(false) }}
                        placeholder="Page title..."
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
                            onClick={handleCreatePage}
                            disabled={!newPageTitle.trim()}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 10,
                                border: 'none',
                                background: '#6366f1',
                                color: 'white',
                                cursor: newPageTitle.trim() ? 'pointer' : 'default',
                                opacity: newPageTitle.trim() ? 1 : 0.5,
                                fontSize: '0.9rem',
                            }}
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setCreatingPage(false)}
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
            )}

            {/* Table of contents */}
            {filteredPages.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>
                    {notebook.pages.length === 0 ? 'No pages yet. Create one above.' : 'No pages match this tag.'}
                </p>
            ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {filteredPages.map((page) => {
                        const pageTags = (page.tagIds ?? [])
                            .map((id) => notebook.tags.find((t) => t.id === id))
                            .filter(Boolean) as typeof notebook.tags
                        return (
                            <div
                                key={page.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 12,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    cursor: 'pointer',
                                }}
                                onClick={() => onOpenPage(page.id)}
                            >
                                <div style={{ display: 'grid', gap: '0.3rem' }}>
                                    <span style={{ fontWeight: 500 }}>📄 {page.title}</span>
                                    {pageTags.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                            {pageTags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    style={{
                                                        padding: '0.1rem 0.5rem',
                                                        borderRadius: 20,
                                                        fontSize: '0.75rem',
                                                        background: tag.color,
                                                        color: tagTextColor(tag.color),
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {tag.label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${page.title}"?`)) onDeletePage(page.id) }}
                                    style={{
                                        padding: '0.3rem 0.5rem',
                                        borderRadius: 8,
                                        border: '1px solid transparent',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--muted)',
                                        fontSize: '0.85rem',
                                        flexShrink: 0,
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}