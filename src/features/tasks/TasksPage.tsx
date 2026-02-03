type Props = {
    weeklyTheme: string
    dailyAffirmation: string
}

export default function TasksPage({ weeklyTheme, dailyAffirmation }: Props) {
    return (
        <section style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Header / anchor */}
            <header style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ color: 'var(--muted)' }}>
                    This week: <span style={{ fontStyle: 'italic' }}>{weeklyTheme}</span>
                </div>

                <div style={{ fontSize: '1.15rem', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--muted)' }}>Today: </span>
                    “{dailyAffirmation}”
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem' }}>
                {/* Main */}
                <main
                    style={{
                        padding: '1rem',
                        borderRadius: 14,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        minHeight: 240,
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Today</h3>
                    <p style={{ margin: 0, color: 'var(--muted)' }}>
                        Tasks go here next.
                    </p>
                </main>

                {/* Sidebar */}
                <aside
                    style={{
                        padding: '1rem',
                        borderRadius: 14,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        minHeight: 240,
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>This Week</h3>
                    <p style={{ margin: 0, color: 'var(--muted)' }}>
                        Weekly tasks + mini calendar next.
                    </p>
                </aside>
            </div>
        </section>
    )
}
