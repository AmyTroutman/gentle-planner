export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type SnackEntry = {
    id: string
    text: string
    createdAt: string // ISO
}

export type DrinkEntry = {
    id: string
    text: string
    createdAt: string // ISO
}

export type DailyMeals = {
    breakfast?: string
    lunch?: string
    dinner?: string
    snacks: SnackEntry[]
    drinks: DrinkEntry[]
}
