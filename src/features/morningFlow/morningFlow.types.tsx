import type { Task } from '../tasks/tasks.types'
import type { WeeklyResetData } from '../weeklyReset/weeklyReset.types'

export type MorningStep =
    | 'greeting'
    | 'weeklyThemeSetup'
    | 'theme'
    | 'affirmation'
    | 'breakfast'
    | 'transition'
    | 'tasks'

export type Reflection = {
    id: string
    text: string
    createdAt: string // ISO string
    dayId: string
}

export type WeekData = {
    weekId: string
    theme: string
    reflections: Reflection[]
    affirmationsByDay: Record<string, string> // dayId -> affirmation
    weeklyTasks: Task[]
    weeklyReset?: WeeklyResetData
}

export type WeeksMap = Record<string, WeekData>

