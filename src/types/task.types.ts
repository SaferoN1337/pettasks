export type TaskCategory = 'productive' | 'fun'

export interface Task {
  id: string
  title: string
  category: TaskCategory
  satietyBonus: number    // 0-20
  happinessBonus: number  // 0-20
  icon: string
  apiType?: 'movie' | 'recipe' | 'drawing' | 'walk'
  isCustom?: boolean      // пользовательская задача
  description?: string    // опциональное описание
}

export interface CompletedTask {
  taskId: string
  taskTitle: string
  completedAt: number
  satietyBonus: number
  happinessBonus: number
}

export type TaskFilter = 'all' | 'productive' | 'fun'
