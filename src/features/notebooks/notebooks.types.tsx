export type BlockType = 'text' | 'checklist'

export type ChecklistItem = {
    id: string
    text: string
    checked: boolean
}

export type TextBlock = {
    id: string
    type: 'text'
    content: string
}

export type ChecklistBlock = {
    id: string
    type: 'checklist'
    title: string
    items: ChecklistItem[]
}

export type Block = TextBlock | ChecklistBlock

export type NotebookTag = {
    id: string
    label: string
    color: string // hex or css color
}

export type NotebookPage = {
    id: string
    title: string
    tagIds: string[]  // references NotebookTag.id
    blocks: Block[]
    createdAt: string
    updatedAt: string
}

export type Notebook = {
    id: string
    title: string
    emoji: string
    tags: NotebookTag[]  // the tag palette for this notebook
    createdAt: string
    pages: NotebookPage[]
}

export type NotebooksMap = Record<string, Notebook>