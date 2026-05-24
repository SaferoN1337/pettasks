import type { Task } from '../types/task.types'

export const productiveTasks: Task[] = [
  { id: 'p1',  title: 'Сделать уборку',                  category: 'productive', satietyBonus: 15, happinessBonus: 5,  icon: '🧹' },
  { id: 'p2',  title: 'Прочитать 30 страниц',            category: 'productive', satietyBonus: 12, happinessBonus: 8,  icon: '📚' },
  { id: 'p3',  title: 'Выучить 5 слов на английском',    category: 'productive', satietyBonus: 10, happinessBonus: 5,  icon: '🇬🇧' },
  { id: 'p4',  title: 'Сделать зарядку',                 category: 'productive', satietyBonus: 18, happinessBonus: 10, icon: '🏋️' },
  { id: 'p5',  title: 'Составить план на день',          category: 'productive', satietyBonus: 8,  happinessBonus: 3,  icon: '📋' },
  { id: 'p6',  title: 'Покодить 1 час',                  category: 'productive', satietyBonus: 20, happinessBonus: 7,  icon: '💻' },
  { id: 'p7',  title: 'Помедитировать 10 минут',         category: 'productive', satietyBonus: 10, happinessBonus: 12, icon: '🧘' },
  { id: 'p8',  title: 'Принять расслабляющий душ',       category: 'productive', satietyBonus: 12, happinessBonus: 6,  icon: '🚿' },
  { id: 'p9',  title: 'Приготовить обед',                category: 'productive', satietyBonus: 16, happinessBonus: 8,  icon: '🍳' },
  { id: 'p10', title: 'Позвонить родителям',             category: 'productive', satietyBonus: 10, happinessBonus: 15, icon: '📞' },
]
