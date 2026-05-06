// Tags for calendar entries — only scheduling/planning concerns
export type CalendarTag = 'event' | 'game' | 'work'

// Tags that represent tracker data — stored in trackersByDay, not calendarEntriesByDay
export type TrackerTag = 'period' | 'weight' | 'anxiety' | 'symptom'

// Dot colors used on the calendar grid (both entry tags and tracker tags)
export type AnyCalendarDotTag = CalendarTag | TrackerTag

export type CalendarEntry = {
    id: string
    title: string
    tags: CalendarTag[]
    notes?: string
    done: boolean
    movedTo?: 'week' | 'day' | null
    createdAt: string // ISO
}

export type DayTracker = {
    period: boolean
    weight?: number
    anxiety?: number // 1–5
    symptoms: string[]
    medications: boolean
}
