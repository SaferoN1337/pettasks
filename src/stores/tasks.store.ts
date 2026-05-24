import { ref, computed } from 'vue'
import type { Task, CompletedTask, TaskFilter } from '../types/task.types'
import { productiveTasks as defaultProductive } from '../data/productiveTasks'
import { funTasks as defaultFun } from '../data/funTasks'
import { usePetStore } from './pet.store'

const HISTORY_KEY        = 'pettasks:history'
const STREAK_KEY         = 'pettasks:streak'
const CUSTOM_TASKS_KEY   = 'pettasks:custom_tasks'
const HIDDEN_TASKS_KEY   = 'pettasks:hidden_tasks'
const DELETED_TASKS_KEY  = 'pettasks:deleted_tasks'  // окончательно удалённые
const DEFAULT_OVERRIDES  = 'pettasks:default_overrides'
const MAX_HISTORY = 5

interface StreakData { count: number; date: string; bonusGiven: boolean }

function ls<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r) } catch {}
  return fallback
}

// ── Синглтон-состояние ───────────────────────────────────────────

const petStore = usePetStore()

const customTasks      = ref<Task[]>(ls(CUSTOM_TASKS_KEY, []))
const hiddenTaskIds    = ref<Set<string>>(new Set<string>(ls(HIDDEN_TASKS_KEY, [])))
const deletedTaskIds   = ref<Set<string>>(new Set<string>(ls(DELETED_TASKS_KEY, [])))
const defaultOverrides = ref<Record<string, Partial<Task>>>(ls(DEFAULT_OVERRIDES, {}))
const completedHistory = ref<CompletedTask[]>(ls(HISTORY_KEY, []))
const streak           = ref<StreakData>(ls(STREAK_KEY, { count: 0, date: '', bonusGiven: false }))
const filter           = ref<TaskFilter>('all')
const lastBonusMessage = ref<string | null>(null)

function saveCustom()    { localStorage.setItem(CUSTOM_TASKS_KEY, JSON.stringify(customTasks.value)) }
function saveHidden()    { localStorage.setItem(HIDDEN_TASKS_KEY, JSON.stringify([...hiddenTaskIds.value])) }
function saveDeleted()   { localStorage.setItem(DELETED_TASKS_KEY, JSON.stringify([...deletedTaskIds.value])) }
function saveOverrides() { localStorage.setItem(DEFAULT_OVERRIDES, JSON.stringify(defaultOverrides.value)) }

function applyOverride(task: Task): Task {
  const ov = defaultOverrides.value[task.id]
  return ov ? { ...task, ...ov } : task
}

// Все дефолтные задачи (с применёнными переопределениями, без окончательно удалённых)
const allDefaultTasks = computed<Task[]>(() =>
  [...defaultProductive, ...defaultFun]
    .filter(t => !deletedTaskIds.value.has(t.id))
    .map(applyOverride)
)

const visibleDefaultTasks = computed<Task[]>(() =>
  allDefaultTasks.value.filter(t => !hiddenTaskIds.value.has(t.id))
)

// Скрытые (в корзине восстановления), но не окончательно удалённые
const hiddenDefaultTasks = computed<Task[]>(() =>
  allDefaultTasks.value.filter(t => hiddenTaskIds.value.has(t.id))
)

const allTasks = computed<Task[]>(() => [
  ...visibleDefaultTasks.value,
  ...customTasks.value,
])

const productiveTasks = computed<Task[]>(() => [
  ...visibleDefaultTasks.value.filter(t => t.category === 'productive'),
  ...customTasks.value.filter(t => t.category === 'productive'),
])

const funTasksList = computed<Task[]>(() => [
  ...visibleDefaultTasks.value.filter(t => t.category === 'fun'),
  ...customTasks.value.filter(t => t.category === 'fun'),
])

const filteredTasks = computed<Task[]>(() => {
  switch (filter.value) {
    case 'productive': return productiveTasks.value
    case 'fun':        return funTasksList.value
    default:           return allTasks.value
  }
})

// Количество скрытых задач доступных для восстановления
const hiddenCount = computed<number>(() => hiddenTaskIds.value.size)

// ── Выполнение ───────────────────────────────────────────────────

function completeTask(task: Task) {
  petStore.addSatiety(task.satietyBonus)
  petStore.addHappiness(task.happinessBonus)
  const completed: CompletedTask = {
    taskId: task.id, taskTitle: task.title,
    completedAt: Date.now(),
    satietyBonus: task.satietyBonus,
    happinessBonus: task.happinessBonus,
  }
  completedHistory.value.unshift(completed)
  completedHistory.value = completedHistory.value.slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(completedHistory.value))
  updateStreak()
}

function updateStreak() {
  const today = new Date().toLocaleDateString('ru-RU')
  const s = streak.value
  if (s.date !== today) { s.count = 1; s.date = today; s.bonusGiven = false }
  else s.count++
  if (s.count % 3 === 0 && !s.bonusGiven) {
    petStore.addHappiness(5)
    s.bonusGiven = true
    lastBonusMessage.value = `🎉 Серия из ${s.count} задач! +5 к счастью питомца!`
    setTimeout(() => { lastBonusMessage.value = null }, 4000)
  }
  localStorage.setItem(STREAK_KEY, JSON.stringify(s))
}

// ── Пользовательские задачи ───────────────────────────────────────

function addCustomTask(task: Omit<Task, 'id' | 'isCustom'>): Task {
  const t: Task = {
    ...task,
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    isCustom: true,
  }
  customTasks.value.push(t)
  saveCustom()
  return t
}

function updateCustomTask(id: string, updates: Partial<Omit<Task, 'id' | 'isCustom'>>) {
  const idx = customTasks.value.findIndex(t => t.id === id)
  if (idx === -1) return
  customTasks.value[idx] = { ...customTasks.value[idx], ...updates }
  saveCustom()
}

function deleteCustomTask(id: string) {
  customTasks.value = customTasks.value.filter(t => t.id !== id)
  saveCustom()
}

// ── Стандартные задачи: переопределения ──────────────────────────

function updateDefaultTask(id: string, updates: Partial<Omit<Task, 'id' | 'isCustom'>>) {
  defaultOverrides.value[id] = { ...(defaultOverrides.value[id] || {}), ...updates }
  defaultOverrides.value = { ...defaultOverrides.value }
  saveOverrides()
}

function resetDefaultTask(id: string) {
  delete defaultOverrides.value[id]
  defaultOverrides.value = { ...defaultOverrides.value }
  saveOverrides()
}

// ── Скрытие / восстановление / окончательное удаление ────────────

/** Временно скрыть (задача попадает в список восстановления) */
function hideDefaultTask(id: string) {
  hiddenTaskIds.value.add(id)
  hiddenTaskIds.value = new Set(hiddenTaskIds.value)
  saveHidden()
}

/** Восстановить одну задачу из списка скрытых */
function restoreDefaultTask(id: string) {
  hiddenTaskIds.value.delete(id)
  hiddenTaskIds.value = new Set(hiddenTaskIds.value)
  saveHidden()
}

/** Восстановить все скрытые задачи */
function restoreDefaultTasks() {
  hiddenTaskIds.value = new Set()
  saveHidden()
}

/** Окончательно удалить задачу (не восстанавливается) */
function permanentlyDeleteTask(id: string) {
  // Убираем из скрытых
  hiddenTaskIds.value.delete(id)
  hiddenTaskIds.value = new Set(hiddenTaskIds.value)
  saveHidden()
  // Добавляем в окончательно удалённые
  deletedTaskIds.value.add(id)
  deletedTaskIds.value = new Set(deletedTaskIds.value)
  saveDeleted()
  // Удаляем переопределения если были
  if (defaultOverrides.value[id]) {
    delete defaultOverrides.value[id]
    defaultOverrides.value = { ...defaultOverrides.value }
    saveOverrides()
  }
}

function setFilter(f: TaskFilter) { filter.value = f }

// ── Composable ───────────────────────────────────────────────────

export function useTasksStore() {
  return {
    allTasks, customTasks, hiddenTaskIds, hiddenCount,
    hiddenDefaultTasks, productiveTasks, funTasksList,
    filteredTasks, completedHistory, streak, filter, lastBonusMessage,
    completeTask, setFilter,
    addCustomTask, updateCustomTask, deleteCustomTask,
    updateDefaultTask, resetDefaultTask,
    hideDefaultTask, restoreDefaultTask, restoreDefaultTasks,
    permanentlyDeleteTask,
  }
}
