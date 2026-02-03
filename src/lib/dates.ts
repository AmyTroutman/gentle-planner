import { format, startOfWeek, addWeeks } from 'date-fns'

export function getWeekId(date: Date = new Date()): string {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    return format(start, 'yyyy-MM-dd')
}

export function getDayId(date: Date = new Date()): string {
    return format(date, 'yyyy-MM-dd')
}

export function getPreviousWeekId(date: Date = new Date()): string {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const prev = addWeeks(start, -1)
    return format(prev, 'yyyy-MM-dd')
}
