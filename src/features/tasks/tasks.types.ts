export type TaskScope = 'today' | 'week' | 'month'

export type Subtask = {
    id: string
    title: string
    done: boolean
    createdAt: string // ISO
}

export type Task = {
    id: string
    title: string
    done: boolean
    scope: TaskScope

    createdAt: string   // ISO
    doneAt?: string     // ISO — set when done is toggled to true

    dayId?: string      // YYYY-MM-DD — set when scope === 'today'
    weekId?: string     // YYYY-MM-DD (Sunday) — set when scope === 'today' | 'week'
    dueDate?: string    // YYYY-MM-DD — optional, used for scope === 'month' sorting

    subtasks?: Subtask[]
}
