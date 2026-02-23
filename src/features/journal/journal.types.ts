export type ChatMessage = {
    role: 'user' | 'assistant'
    content: string
    createdAt: string // ISO
}