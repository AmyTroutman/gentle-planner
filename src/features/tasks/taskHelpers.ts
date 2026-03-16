import type { Task, TaskScope } from './tasks.types'

/** All tasks for a given dayId (scope === 'today') */
export function getTasksForDay(tasks: Record<string, Task>, dayId: string): Task[] {
    return Object.values(tasks).filter(t => t.scope === 'today' && t.dayId === dayId)
}

/** All tasks for a given weekId (scope === 'week') */
export function getTasksForWeek(tasks: Record<string, Task>, weekId: string): Task[] {
    return Object.values(tasks).filter(t => t.scope === 'week' && t.weekId === weekId)
}

/** All month-scope tasks, sorted: tasks with dueDate ascending, then undated tasks */
export function getMonthTasks(tasks: Record<string, Task>): Task[] {
    const all = Object.values(tasks).filter(t => t.scope === 'month')
    const dated = all.filter(t => t.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    const undated = all.filter(t => !t.dueDate)
    return [...dated, ...undated]
}

/** Yesterday's incomplete day tasks */
export function getYesterdayIncompleteTasks(tasks: Record<string, Task>, yesterdayId: string): Task[] {
    return Object.values(tasks).filter(
        t => t.scope === 'today' && t.dayId === yesterdayId && !t.done
    )
}

/** Move a task to today — updates scope, dayId, weekId in place */
export function moveTaskToToday(
    tasks: Record<string, Task>,
    taskId: string,
    dayId: string,
    weekId: string
): Record<string, Task> {
    const task = tasks[taskId]
    if (!task) return tasks
    return { ...tasks, [taskId]: { ...task, scope: 'today', dayId, weekId } }
}

/** Move a task to week — updates scope, weekId, clears dayId */
export function moveTaskToWeek(
    tasks: Record<string, Task>,
    taskId: string,
    weekId: string
): Record<string, Task> {
    const task = tasks[taskId]
    if (!task) return tasks
    const updated = { ...task, scope: 'week' as TaskScope, weekId }
    delete (updated as any).dayId
    return { ...tasks, [taskId]: updated }
}

/** Move a task to month — updates scope, optionally sets dueDate, clears dayId/weekId */
export function moveTaskToMonth(
    tasks: Record<string, Task>,
    taskId: string,
    dueDate?: string
): Record<string, Task> {
    const task = tasks[taskId]
    if (!task) return tasks
    const updated: Task = { ...task, scope: 'month' }
    if (dueDate) updated.dueDate = dueDate
    delete (updated as any).dayId
    delete (updated as any).weekId
    return { ...tasks, [taskId]: updated }
}

/** Toggle done on a task, setting/clearing doneAt */
export function toggleTask(tasks: Record<string, Task>, taskId: string): Record<string, Task> {
    const task = tasks[taskId]
    if (!task) return tasks
    const done = !task.done
    return {
        ...tasks,
        [taskId]: {
            ...task,
            done,
            doneAt: done ? new Date().toISOString() : undefined,
        },
    }
}

/** Add a new task */
export function addTask(
    tasks: Record<string, Task>,
    partial: Omit<Task, 'id' | 'createdAt' | 'done'>
): Record<string, Task> {
    const id = crypto.randomUUID()
    const task: Task = { ...partial, id, done: false, createdAt: new Date().toISOString() }
    return { ...tasks, [id]: task }
}

/** Delete a task */
export function deleteTask(tasks: Record<string, Task>, taskId: string): Record<string, Task> {
    const next = { ...tasks }
    delete next[taskId]
    return next
}
