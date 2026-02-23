import { useState, useEffect, useRef } from 'react'
import type { ChatMessage } from './journal.types'

type Props = {
    messages: ChatMessage[]
    onMessagesChange: (messages: ChatMessage[]) => void
}

export default function ChatTab({ messages, onMessagesChange }: Props) {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    async function sendMessage() {
        const text = input.trim()
        if (!text || isLoading) return

        const userMessage: ChatMessage = {
            role: 'user',
            content: text,
            createdAt: new Date().toISOString(),
        }

        const nextMessages = [...messages, userMessage]
        onMessagesChange(nextMessages)
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: nextMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error ?? 'Something went wrong')
            }

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.text,
                createdAt: new Date().toISOString(),
            }

            onMessagesChange([...nextMessages, assistantMessage])
        } catch (err) {
            console.error('Chat error:', err)
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Something went wrong. Please try again.',
                createdAt: new Date().toISOString(),
            }
            onMessagesChange([...nextMessages, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: '1rem', height: '60vh' }}>
            {/* Message thread */}
            <div
                style={{
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    paddingRight: '0.25rem',
                }}
            >
                {messages.length === 0 && (
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
                        Start typing to begin a conversation...
                    </p>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                maxWidth: '80%',
                                padding: '0.65rem 0.9rem',
                                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                background: msg.role === 'user' ? '#2c454d' : 'white',
                                color: msg.role === 'user' ? 'white' : 'inherit',
                                border: msg.role === 'assistant' ? '1px solid #d1d5db' : 'none',
                                fontSize: '0.95rem',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div
                            style={{
                                padding: '0.65rem 0.9rem',
                                borderRadius: '14px 14px 14px 4px',
                                background: 'white',
                                border: '1px solid #d1d5db',
                                color: 'var(--muted)',
                                fontSize: '0.95rem',
                            }}
                        >
                            ...
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                        }
                    }}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={3}
                />
                <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                >
                    Send
                </button>
            </div>
        </div>
    )
}