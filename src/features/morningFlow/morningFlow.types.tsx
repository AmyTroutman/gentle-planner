import type { Task } from '../tasks/tasks.types'

export type MorningStep =
    | 'greeting'
    | 'theme'
    | 'affirmation'
    | 'breakfast'
    | 'transition'
    | 'tasks'

export type Reflection = {
    id: string
    text: string
    createdAt: string // ISO string
}

export type WeekData = {
    weekId: string
    theme: string
    reflections: Reflection[]
    affirmationsByDay?: Record<string, string> // dayId -> affirmation
    weeklyTasks?: Task[]
}
