import { useState } from 'react'
import type { ChatMessage } from './journal.types'
import ReflectionTab from './ReflectionTab'
import JournalTab from './JournalTab'
import ChatTab from './ChatTab'

type Tab = 'reflection' | 'journal' | 'chat'

type Props = {
    reflection: string
    weeklyTheme: string
    onReflectionChange: (value: string) => void
    journal: string
    onJournalChange: (value: string) => void
    messages: ChatMessage[]
    onMessagesChange: (messages: ChatMessage[]) => void
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
        { id: 'chat', label: 'Wren' },
    ]

    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Journal</h2>
                <button onClick={onClose}>Back to Today</button>
            </header>

            <div className="journal-tab-layout">
                <div className="journal-side-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`journal-side-tab${activeTab === tab.id ? ' active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="journal-panel">
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
            </div>
        </section>
    )
}