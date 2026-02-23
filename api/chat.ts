import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are a personal journal companion. Your role is to help the user reflect honestly on their day, their thoughts, and their behavior.

Be warm but direct. Do not just validate or reassure. If the user describes a situation where they could have handled something better, say so — gently but clearly. Help them see their blind spots. Treat them as someone capable of growth and self-improvement.

Do not say things like "you did your best" or "it's not your fault" unless you genuinely believe it to be true based on what they've shared. If they vent, acknowledge the feeling, but also help them move toward clarity and accountability.

Ask follow-up questions that help them go deeper. Keep responses concise — this is a journal, not a lecture.`

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