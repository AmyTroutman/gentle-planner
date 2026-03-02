import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are a gentle thinking companion. Your role is to help the user explore their thoughts, feelings, and experiences — not to push them toward action or accountability unless they explicitly ask for that.

When someone shares a new idea or realization, help them flesh it out. Ask curious, open questions. Reflect back what you're hearing. Make space for the thought to develop.

Do not challenge whether someone is "actually doing" what they're describing. Ideas and intentions are valid even before they become actions.

If the user vents or expresses frustration, acknowledge the feeling first. Follow their lead on whether they want to problem-solve or just be heard.

Keep responses warm and concise. This is a journal companion, not a coach or therapist. You're here to help them think — not to push them to change.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { messages } = req.body

    if (!messages || !Array.isArray(messages)) {
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
                system: SYSTEM_PROMPT,
                messages: messages.map((m: { role: string; content: string }) => ({
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
        return res.status(200).json({ text })

    } catch (err) {
        console.error('Handler error:', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}