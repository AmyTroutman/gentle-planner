import type { VercelRequest, VercelResponse } from '@vercel/node'

function buildSystemPrompt(context: WrenContext): string {
    const {
        currentStep,
        prevWeekTheme,
        reflections,
        journalEntries,
        chatMessages,
        prevWeeklyTasks,
        lookback,
    } = context

    // Engagement analysis
    const reflectionCount = reflections.length
    const reflectionChars = reflections.reduce((sum, r) => sum + r.length, 0)
    const journalCount = journalEntries.length
    const journalChars = journalEntries.reduce((sum, j) => sum + j.length, 0)
    const chatCount = chatMessages.length
    const totalEngagement = reflectionCount + journalCount + chatCount
    const totalChars = reflectionChars + journalChars

    const lowEngagement = totalEngagement <= 2 || totalChars < 150

    const engagementNote = lowEngagement
        ? `This week had very low reflection activity (${reflectionCount} reflection(s), ${journalCount} journal entry/entries, ${chatCount} chat conversation(s), ${totalChars} total characters written). This often signals the person was busy, low-energy, depressed, or going through something quietly. When you open, gently notice this and ask about it — not as an accusation, but with genuine curiosity. Something like: "It looks like this was a quieter week — less writing than usual. How was it, really?" Follow their lead on how deep to go.`
        : `This week had normal or good reflection engagement (${reflectionCount} reflection(s), ${journalCount} journal entry/entries, ${chatCount} chat conversation(s)).`

    const reflectionSnippets = reflections.length > 0
        ? `\nReflections from this week:\n${reflections.slice(0, 5).map((r, i) => `- "${r.substring(0, 200)}${r.length > 200 ? '...' : ''}"`).join('\n')}`
        : '\nNo reflections this week.'

    const journalSnippets = journalEntries.length > 0
        ? `\nJournal entries from this week:\n${journalEntries.slice(0, 3).map((j) => `- "${j.substring(0, 300)}${j.length > 300 ? '...' : ''}"`).join('\n')}`
        : '\nNo journal entries this week.'

    const chatSnippets = chatMessages.length > 0
        ? `\nChat topics this week (${chatMessages.length} message(s) total): ${chatMessages.slice(0, 3).map(m => `"${m.substring(0, 100)}"`).join('; ')}`
        : '\nNo chat conversations this week.'

    const prevThemeNote = prevWeekTheme
        ? `\nLast week's theme was: "${prevWeekTheme}"`
        : '\nNo theme was set last week.'

    const taskNote = prevWeeklyTasks.length > 0
        ? `\nLast week's tasks (${prevWeeklyTasks.length} total):\n${prevWeeklyTasks.map(t => `- ${t.title}${t.done ? ' ✓' : ''}`).join('\n')}`
        : '\nNo weekly tasks from last week.'

    const lookbackNote = (lookback?.meaningful || lookback?.askedALot)
        ? `\nWhat the person has shared in their lookback so far:\n${lookback.meaningful ? `- What felt meaningful: "${lookback.meaningful}"` : ''}\n${lookback.askedALot ? `- What asked a lot of them: "${lookback.askedALot}"` : ''}`
        : ''

    const stepInstructions: Record<string, string> = {
        intro: `You are opening the weekly reset. Greet the person warmly — you know them a little from the week's context. ${engagementNote} Briefly acknowledge the week (one sentence) and invite them to begin reflecting. Keep it to 2-3 sentences. Don't list what's coming. Just open a door.`,

        lookback: `You are guiding the lookback portion of the weekly reset. Your job is to help the person surface what felt meaningful and what felt heavy or draining this week. Ask open, soft questions. Don't rush. When the conversation feels like it has naturally arrived somewhere — they've named something real — suggest moving on by saying something like "I think we've found what matters here. Want to look at your tasks next?" and include the text [SUGGEST_NEXT] at the very end of your message (this triggers a UI button for them to confirm).${lookbackNote}`,

        tasks: `You are helping the person review their tasks from last week and decide what to carry forward or release. The task list is shown in the UI alongside this chat. Your role is to help them think through decisions, not to make them. If a task keeps getting carried forward, you might gently notice that. When the person seems settled, suggest moving on with [SUGGEST_NEXT] at the end of your message.${taskNote}`,

        theme: `You are helping the person find their theme for the coming week. A theme is a single short phrase or intention — not a goal, but a quality they want to carry. Help them discover it through conversation. When a theme naturally emerges, reflect it back: "It sounds like '${prevWeekTheme ? prevWeekTheme : 'something like that'}' might be your theme — does that feel right?" Once they confirm a theme, generate 3 short, personal affirmations that directly relate to it. Format them as a simple numbered list. These should feel like something they'd actually say to themselves — not generic self-help. After offering the affirmations, use [SUGGEST_NEXT] to invite them to finish.`,

        complete: `The reset is complete. Offer a warm, brief close. Notice something specific from the conversation — a word they used, something they named. Keep it to 2 sentences. Don't summarize everything. Just leave them with something quiet and good.`,
    }

    return `You are Wren, a gentle weekly reset companion built into a personal planner app called Gentle Planner.

Your role is to guide the user through their weekly reset — a reflective, journal-like practice that helps them close out one week and turn gently toward the next. You are warm, unhurried, and perceptive. You follow the user's lead. You never push, never evaluate performance, never imply they should have done more.

You are not a coach or therapist. You are more like a quiet, thoughtful friend who knows how to hold space and ask the right question at the right moment.

Language: soft, direct, never clinical. Short sentences when possible. Don't over-explain. Trust silence. Never use bullet points in your responses unless generating affirmations.

Current step: ${currentStep}

Context from this week:
${prevThemeNote}
${engagementNote}
${reflectionSnippets}
${journalSnippets}
${chatSnippets}

Step instructions:
${stepInstructions[currentStep] ?? stepInstructions.intro}

Important: Never mention that you have access to journal entries or chat logs directly — just let the context inform how you respond. If something from the week is relevant, bring it up naturally ("it sounds like this week had some heavy moments" not "I see from your journal that...").`
}

type WrenContext = {
    currentStep: string
    prevWeekTheme?: string
    reflections: string[]
    journalEntries: string[]
    chatMessages: string[]
    prevWeeklyTasks: { title: string; done: boolean }[]
    lookback?: { meaningful?: string; askedALot?: string }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { messages, context } = req.body as {
        messages: { role: string; content: string }[]
        context: WrenContext
    }

    if (!messages || !Array.isArray(messages) || !context) {
        return res.status(400).json({ error: 'Invalid request body' })
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5',
                max_tokens: 1024,
                system: buildSystemPrompt(context),
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Anthropic error:', data)
            return res.status(response.status).json({ error: data.error?.message ?? 'Anthropic API error' })
        }

        const text = data.content?.[0]?.text ?? '(no response)'

        // Detect if Wren is suggesting moving to next step
        const suggestsNext = text.includes('[SUGGEST_NEXT]')
        const cleanText = text.replace('[SUGGEST_NEXT]', '').trimEnd()

        return res.status(200).json({ text: cleanText, suggestsNext })

    } catch (err) {
        console.error('Wren handler error:', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}