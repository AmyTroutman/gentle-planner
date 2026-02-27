import { useState } from 'react'
import type { NotebookPage, Block, NotebookTag, ChecklistItem } from './notebooks.types'

type Props = {
    page: NotebookPage
    notebookTitle: string
    notebookEmoji: string
    notebookTags: NotebookTag[]
    onBack: () => void
    onUpdatePage: (updated: NotebookPage) => void
}

function tagTextColor(bg: string): string {
    const hex = bg.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.55 ? '#374151' : '#fff'
}

export default function PageView({ page, notebookTitle, notebookEmoji, notebookTags, onBack, onUpdatePage }: Props) {
    const [editingTitle, setEditingTitle] = useState(false)
    const [titleDraft, setTitleDraft] = useState(page.title)

    function update(patch: Partial<NotebookPage>) {
        onUpdatePage({ ...page, ...patch, updatedAt: new Date().toISOString() })
    }

    function saveTitle() {
        const t = titleDraft.trim()
        if (t && t !== page.title) update({ title: t })
        setEditingTitle(false)
    }

    function toggleTag(tagId: string) {
        const tagIds = page.tagIds ?? []
        update({
            tagIds: tagIds.includes(tagId)
                ? tagIds.filter((id) => id !== tagId)
                : [...tagIds, tagId],
        })
    }

    // Block helpers
    function updateBlock(blockId: string, patch: Partial<Block>) {
        update({
            blocks: page.blocks.map((b) => b.id === blockId ? { ...b, ...patch } as Block : b),
        })
    }

    function deleteBlock(blockId: string) {
        update({ blocks: page.blocks.filter((b) => b.id !== blockId) })
    }

    function addTextBlock() {
        update({ blocks: [...page.blocks, { id: crypto.randomUUID(), type: 'text', content: '' }] })
    }

    function addChecklistBlock() {
        update({
            blocks: [...page.blocks, {
                id: crypto.randomUUID(),
                type: 'checklist',
                title: 'Checklist',
                items: [],
            }],
        })
    }

    function addChecklistItem(blockId: string) {
        const block = page.blocks.find((b) => b.id === blockId)
        if (!block || block.type !== 'checklist') return
        const item: ChecklistItem = { id: crypto.randomUUID(), text: '', checked: false }
        updateBlock(blockId, { items: [...block.items, item] })
    }

    function updateChecklistItem(blockId: string, itemId: string, patch: Partial<ChecklistItem>) {
        const block = page.blocks.find((b) => b.id === blockId)
        if (!block || block.type !== 'checklist') return
        updateBlock(blockId, {
            items: block.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
        })
    }

    function deleteChecklistItem(blockId: string, itemId: string) {
        const block = page.blocks.find((b) => b.id === blockId)
        if (!block || block.type !== 'checklist') return
        updateBlock(blockId, { items: block.items.filter((i) => i.id !== itemId) })
    }

    const tagIds = page.tagIds ?? []

    return (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Back button */}
            <header>
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
                    ← {notebookEmoji} {notebookTitle}
                </button>
            </header>

            {/* Page title */}
            {editingTitle ? (
                <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle()
                        if (e.key === 'Escape') { setTitleDraft(page.title); setEditingTitle(false) }
                    }}
                    style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        border: 'none',
                        borderBottom: '2px solid #6366f1',
                        outline: 'none',
                        padding: '0.25rem 0',
                        fontFamily: 'inherit',
                        width: '100%',
                        background: 'transparent',
                    }}
                />
            ) : (
                <h2
                    onClick={() => setEditingTitle(true)}
                    style={{ margin: 0, fontSize: '1.4rem', cursor: 'text', lineHeight: 1.3 }}
                    title="Click to edit title"
                >
                    {page.title}
                </h2>
            )}

            {/* Tags */}
            {notebookTags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Tags:</span>
                    {notebookTags.map((tag) => {
                        const active = tagIds.includes(tag.id)
                        return (
                            <button
                                key={tag.id}
                                onClick={() => toggleTag(tag.id)}
                                style={{
                                    padding: '0.2rem 0.65rem',
                                    borderRadius: 20,
                                    border: active ? '1.5px solid transparent' : '1.5px solid #d1d5db',
                                    background: active ? tag.color : 'white',
                                    color: active ? tagTextColor(tag.color) : 'var(--muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.82rem',
                                    fontWeight: active ? 600 : 400,
                                    transition: 'all 0.1s',
                                }}
                            >
                                {tag.label}
                            </button>
                        )
                    })}
                </div>
            )}

            {notebookTags.length === 0 && (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    No tags yet — add some in the notebook view (🏷 Tags button).
                </p>
            )}

            {/* Blocks */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {page.blocks.map((block) => (
                    <div
                        key={block.id}
                        style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 12,
                            border: '1px solid #e5e7eb',
                            background: 'white',
                            position: 'relative',
                        }}
                    >
                        <button
                            onClick={() => deleteBlock(block.id)}
                            style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                padding: '0.2rem 0.4rem',
                                borderRadius: 6,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: '#d1d5db',
                                fontSize: '0.8rem',
                                lineHeight: 1,
                            }}
                            title="Remove block"
                        >
                            ✕
                        </button>

                        {block.type === 'text' && (
                            <textarea
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                placeholder="Write something..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontSize: '0.95rem',
                                    fontFamily: 'inherit',
                                    lineHeight: 1.6,
                                    background: 'transparent',
                                    boxSizing: 'border-box',
                                    paddingRight: '1.5rem',
                                }}
                            />
                        )}

                        {block.type === 'checklist' && (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <input
                                    value={block.title}
                                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        fontFamily: 'inherit',
                                        background: 'transparent',
                                        paddingRight: '1.5rem',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                    }}
                                    placeholder="Checklist title..."
                                />
                                <div style={{ display: 'grid', gap: '0.35rem' }}>
                                    {block.items.map((item) => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={item.checked}
                                                onChange={(e) => updateChecklistItem(block.id, item.id, { checked: e.target.checked })}
                                                style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: '#6366f1' }}
                                            />
                                            <input
                                                value={item.text}
                                                onChange={(e) => updateChecklistItem(block.id, item.id, { text: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(block.id) }
                                                    if (e.key === 'Backspace' && item.text === '') { e.preventDefault(); deleteChecklistItem(block.id, item.id) }
                                                }}
                                                placeholder="Item..."
                                                style={{
                                                    flex: 1,
                                                    border: 'none',
                                                    outline: 'none',
                                                    fontSize: '0.9rem',
                                                    fontFamily: 'inherit',
                                                    background: 'transparent',
                                                    textDecoration: item.checked ? 'line-through' : 'none',
                                                    color: item.checked ? 'var(--muted)' : 'inherit',
                                                }}
                                            />
                                            <button
                                                onClick={() => deleteChecklistItem(block.id, item.id)}
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    color: '#d1d5db',
                                                    fontSize: '0.8rem',
                                                    padding: '0.1rem 0.3rem',
                                                    borderRadius: 4,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => addChecklistItem(block.id)}
                                    style={{
                                        alignSelf: 'start',
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 8,
                                        border: '1px dashed #d1d5db',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.82rem',
                                        color: 'var(--muted)',
                                    }}
                                >
                                    + Add item
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add block buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                    onClick={addTextBlock}
                    style={{
                        padding: '0.5rem 0.9rem',
                        borderRadius: 10,
                        border: '1px dashed #d1d5db',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        color: 'var(--muted)',
                    }}
                >
                    + Text block
                </button>
                <button
                    onClick={addChecklistBlock}
                    style={{
                        padding: '0.5rem 0.9rem',
                        borderRadius: 10,
                        border: '1px dashed #d1d5db',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        color: 'var(--muted)',
                    }}
                >
                    + Checklist
                </button>
            </div>

            {page.blocks.length === 0 && (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                    Add a text block or checklist to get started.
                </p>
            )}
        </div>
    )
}