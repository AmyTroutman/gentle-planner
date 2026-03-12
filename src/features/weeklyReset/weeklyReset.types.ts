import type { ChatMessage } from '../journal/journal.types'

export type WeeklyResetLookback = {
    meaningful?: string
    askedALot?: string
}

export type WeeklyResetTaskDecision = 'carry' | 'release'

export type WeeklyResetData = {
    completed: boolean
    startedAt?: string
    completedAt?: string
    skipped?: boolean
    lookback: WeeklyResetLookback
    pausePrompt?: string
    inspiration?: string
    behavior?: string
    taskDecisions: Record<string, WeeklyResetTaskDecision>
    wrenChat?: ChatMessage[]
}

export type WeeklyResetStep = 'intro' | 'lookback' | 'tasks' | 'theme' | 'complete'