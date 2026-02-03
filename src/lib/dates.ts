import { format, startOfWeek } from 'date-fns'

export function getWeekId(date: Date = new Date()): string {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    return format(start, 'yyyy-MM-dd')
}

export function getDayId(date: Date = new Date()): string {
    return format(date, 'yyyy-MM-dd')
}
