import { useState } from 'react'
import type { ChatMessage } from './journal.types'
import ReflectionTab from './ReflectionTab'
import JournalTab from './JournalTab'
import ChatTab from './ChatTab'

type Tab = 'reflection' | 'journal' | 'chat'

type Props = {
    // Reflection
    reflection: string
    weeklyTheme: string
    onReflectionChange: (value: string) => void

    // Journal
    journal: string
    onJournalChange: (value: string) => void

    // Chat
    messages: ChatMessage[]
    onMessagesChange: (messages: ChatMessage[]) => void

    // Nav
    onClose: () => void
}

export default function JournalPage({
    reflection,
    weeklyTheme,
    onReflectionChange,
    journal,
    onJournalChange,
    messages,
    onMessagesChange,
    onClose,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('reflection')

    const tabs: { id: Tab; label: string }[] = [
        { id: 'reflection', label: 'Reflection' },
        { id: 'journal', label: 'Journal' },
        { id: 'chat', label: 'Chat' },
    ]

    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Journal</h2>
                <button
                    onClick={onClose}
                >
                    Back to Today
                </button>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #d1d5db', paddingBottom: '0' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.6rem 1.1rem',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #2c454d' : '2px solid transparent',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            color: activeTab === tab.id ? '#2c454d' : 'var(--muted)',
                            marginBottom: '-1px',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'reflection' && (
                    <ReflectionTab
                        reflection={reflection}
                        weeklyTheme={weeklyTheme}
                        onChange={onReflectionChange}
                    />
                )}
                {activeTab === 'journal' && (
                    <JournalTab
                        journal={journal}
                        onChange={onJournalChange}
                    />
                )}
                {activeTab === 'chat' && (
                    <ChatTab
                        messages={messages}
                        onMessagesChange={onMessagesChange}
                    />
                )}
            </div>
        </section>
    )
}