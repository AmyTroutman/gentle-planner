import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../journal/journal.types'
import type { WeeklyResetStep } from './weeklyReset.types'
import AnimatedWren from '../../components/AnimatedWren'

type WrenContext = {
    currentStep: WeeklyResetStep
    prevWeekTheme?: string
    reflections: string[]
    journalEntries: string[]
    chatMessages: string[]
    prevWeeklyTasks: { title: string; done: boolean }[]
    lookback?: { meaningful?: string; askedALot?: string }
}

type Props = {
    messages: ChatMessage[]
    onMessagesChange: (messages: ChatMessage[]) => void
    context: WrenContext
    onSuggestNext: () => void
    onConfirmNext: () => void
    pendingNext: boolean
    stepLabel: string
}

const STEP_FALLBACKS: Partial<Record<WeeklyResetStep, string>> = {
    lookback: "Let's look back at this week. What felt meaningful? What asked a lot of you?",
    theme: "What's been on your mind? What wants to guide you into this week?",
    tasks: "Here's what's still open. What do you want to carry forward — and what can you let go?",
}

export default function WrenSidebar({
    messages,
    onMessagesChange,
    context,
    onSuggestNext,
    onConfirmNext,
    pendingNext,
    stepLabel,
}: Props) {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [initialized, setInitialized] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const prevStepRef = useRef<WeeklyResetStep | null>(null)

    // Track which steps Wren has already opened so we don't repeat on back navigation
    const visitedStepsRef = useRef<Set<WeeklyResetStep>>(new Set())

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    useEffect(() => {
        const currentStep = context.currentStep
        const stepChanged = prevStepRef.current !== null && prevStepRef.current !== currentStep
        const isFirstLoad = !initialized && messages.length === 0
        const alreadyVisited = visitedStepsRef.current.has(currentStep)

        if (isFirstLoad || (stepChanged && !alreadyVisited)) {
            prevStepRef.current = currentStep
            visitedStepsRef.current.add(currentStep)
            setInitialized(true)
            sendOpeningMessage()
        } else if (!initialized) {
            // Messages already exist (e.g. persisted from Firestore) — mark all as visited
            prevStepRef.current = currentStep
            visitedStepsRef.current.add(currentStep)
            setInitialized(true)
        } else if (stepChanged) {
            // Stepped back to a visited step — just update the ref, no new message
            prevStepRef.current = currentStep
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context.currentStep])

    async function sendOpeningMessage() {
        setIsLoading(true)
        try {
            const response = await fetch('/api/wren-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [],
                    context,
                }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error ?? 'Error')

            const wrenMessage: ChatMessage = {
                role: 'assistant',
                content: data.text,
                createdAt: new Date().toISOString(),
            }
            onMessagesChange([...messages, wrenMessage])
            if (data.suggestsNext) onSuggestNext()
        } catch {
            const fallback: ChatMessage = {
                role: 'assistant',
                content: STEP_FALLBACKS[context.currentStep] ?? "I'm here whenever you're ready.",
                createdAt: new Date().toISOString(),
            }
            onMessagesChange([...messages, fallback])
        } finally {
            setIsLoading(false)
        }
    }

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
            const response = await fetch('/api/wren-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
                    context,
                }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error ?? 'Error')

            const wrenMessage: ChatMessage = {
                role: 'assistant',
                content: data.text,
                createdAt: new Date().toISOString(),
            }
            onMessagesChange([...nextMessages, wrenMessage])
            if (data.suggestsNext) onSuggestNext()
        } catch {
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

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <aside style={{
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            height: '100%',
            minHeight: 0,
            background: '#fafaf9',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '0.85rem 1rem 0.7rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
            }}>
                <AnimatedWren size={48} />
                <span style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#2c454d',
                }}>Wren</span>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                    marginLeft: '0.25rem',
                }}>{stepLabel}</span>
            </div>

            {/* Messages */}
            <div style={{
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                padding: '1rem',
            }}>
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div style={{
                            maxWidth: '88%',
                            padding: '0.6rem 0.85rem',
                            borderRadius: msg.role === 'user'
                                ? '14px 14px 4px 14px'
                                : '14px 14px 14px 4px',
                            background: msg.role === 'user' ? '#2c454d' : 'white',
                            color: msg.role === 'user' ? 'white' : '#1f2937',
                            border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                            fontSize: '0.9rem',
                            lineHeight: 1.55,
                            whiteSpace: 'pre-wrap',
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            padding: '0.6rem 0.85rem',
                            borderRadius: '14px 14px 14px 4px',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            color: 'var(--muted)',
                            fontSize: '0.85rem',
                        }}>
                            <span style={{ letterSpacing: '0.15em' }}>···</span>
                        </div>
                    </div>
                )}

                {pendingNext && !isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.25rem' }}>
                        <button
                            onClick={onConfirmNext}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 20,
                                border: '1px solid #2c454d',
                                background: 'white',
                                color: '#2c454d',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                            }}
                        >
                            Ready to move on →
                        </button>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '0.75rem',
                borderTop: '1px solid #e5e7eb',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '0.5rem',
                alignItems: 'end',
            }}>
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Say something…"
                    rows={2}
                    style={{
                        resize: 'none',
                        borderRadius: 10,
                        border: '1px solid #d1d5db',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        lineHeight: 1.4,
                        background: 'white',
                        outline: 'none',
                    }}
                />
                <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    style={{
                        padding: '0.55rem 0.9rem',
                        borderRadius: 10,
                        border: 'none',
                        background: input.trim() && !isLoading ? '#2c454d' : '#e5e7eb',
                        color: input.trim() && !isLoading ? 'white' : 'var(--muted)',
                        cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        transition: 'background 0.15s',
                        alignSelf: 'end',
                        height: 38,
                    }}
                >
                    Send
                </button>
            </div>
        </aside>
    )
}