import { useState } from 'react'
import type { Notebook, NotebookPage, NotebookTag, NotebooksMap } from './notebooks.types'
import NotebooksList from './notebooksList'
import NotebookView from './notebookView'
import PageView from './pageView'

type Props = {
    notebooks: NotebooksMap
    onUpdate: (notebooks: NotebooksMap) => void
    onClose: () => void
}

type View =
    | { kind: 'list' }
    | { kind: 'notebook'; notebookId: string }
    | { kind: 'page'; notebookId: string; pageId: string }

export default function NotebooksSection({ notebooks, onUpdate, onClose }: Props) {
    const [view, setView] = useState<View>({ kind: 'list' })

    const notebooksList = Object.values(notebooks).sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt)
    )

    function updateNotebook(id: string, patch: Partial<Notebook>) {
        onUpdate({ ...notebooks, [id]: { ...notebooks[id], ...patch } })
    }

    function createNotebook(title: string, emoji: string) {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const nb: Notebook = { id, title, emoji, tags: [], createdAt: now, pages: [] }
        onUpdate({ ...notebooks, [id]: nb })
        setView({ kind: 'notebook', notebookId: id })
    }

    function deleteNotebook(id: string) {
        const next = { ...notebooks }
        delete next[id]
        onUpdate(next)
        setView({ kind: 'list' })
    }

    function updateTags(notebookId: string, tags: NotebookTag[]) {
        updateNotebook(notebookId, { tags })
    }

    function createPage(notebookId: string, title: string) {
        const nb = notebooks[notebookId]
        if (!nb) return
        const now = new Date().toISOString()
        const page: NotebookPage = {
            id: crypto.randomUUID(),
            title,
            tagIds: [],
            blocks: [],
            createdAt: now,
            updatedAt: now,
        }
        updateNotebook(notebookId, { pages: [...nb.pages, page] })
        setView({ kind: 'page', notebookId, pageId: page.id })
    }

    function deletePage(notebookId: string, pageId: string) {
        const nb = notebooks[notebookId]
        if (!nb) return
        updateNotebook(notebookId, { pages: nb.pages.filter((p) => p.id !== pageId) })
    }

    function updatePage(notebookId: string, updated: NotebookPage) {
        const nb = notebooks[notebookId]
        if (!nb) return
        updateNotebook(notebookId, {
            pages: nb.pages.map((p) => p.id === updated.id ? updated : p),
        })
    }

    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            {view.kind === 'list' && (
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Notebooks</h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: 12,
                            border: '1px solid #d1d5db',
                            background: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        Back to Today
                    </button>
                </header>
            )}

            {view.kind === 'list' && (
                <NotebooksList
                    notebooks={notebooksList}
                    onOpen={(id) => setView({ kind: 'notebook', notebookId: id })}
                    onCreate={createNotebook}
                    onDelete={deleteNotebook}
                />
            )}

            {view.kind === 'notebook' && (() => {
                const nb = notebooks[view.notebookId]
                if (!nb) { setView({ kind: 'list' }); return null }
                return (
                    <NotebookView
                        notebook={nb}
                        onBack={() => setView({ kind: 'list' })}
                        onOpenPage={(pageId) => setView({ kind: 'page', notebookId: nb.id, pageId })}
                        onCreatePage={(title) => createPage(nb.id, title)}
                        onDeletePage={(pageId) => deletePage(nb.id, pageId)}
                        onUpdateTags={(tags) => updateTags(nb.id, tags)}
                    />
                )
            })()}

            {view.kind === 'page' && (() => {
                const nb = notebooks[view.notebookId]
                const page = nb?.pages.find((p) => p.id === view.pageId)
                if (!nb || !page) { setView({ kind: 'list' }); return null }
                return (
                    <PageView
                        page={page}
                        notebookTitle={nb.title}
                        notebookEmoji={nb.emoji}
                        notebookTags={nb.tags}
                        onBack={() => setView({ kind: 'notebook', notebookId: nb.id })}
                        onUpdatePage={(updated) => updatePage(nb.id, updated)}
                    />
                )
            })()}
        </section>
    )
}