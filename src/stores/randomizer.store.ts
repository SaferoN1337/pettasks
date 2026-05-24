import { ref } from 'vue'
import type { Task } from '../types/task.types'
import { productiveTasks } from '../data/productiveTasks'
import { funTasks } from '../data/funTasks'
import { usePetStore } from './pet.store'

const MAX_RECENT = 3

// ── Синглтон-состояние ───────────────────────────────────────────

const isOpen      = ref(false)
const currentTask = ref<Task | null>(null)
const recentIds   = ref<string[]>([])

function pickTask(): Task {
  const petStore = usePetStore()
  const { satiety, happiness } = petStore.pet.value

  let productiveWeight: number
  if (satiety < happiness)      productiveWeight = 0.7
  else if (happiness < satiety) productiveWeight = 0.3
  else                          productiveWeight = 0.5

  const pool = Math.random() < productiveWeight ? productiveTasks : funTasks
  const available = pool.filter(t => !recentIds.value.includes(t.id))
  const source = available.length > 0 ? available : pool
  return source[Math.floor(Math.random() * source.length)]
}

function open() {
  const task = pickTask()
  currentTask.value = task
  recentIds.value.push(task.id)
  if (recentIds.value.length > MAX_RECENT) recentIds.value.shift()
  isOpen.value = true
}

function shuffle() {
  const task = pickTask()
  currentTask.value = task
  recentIds.value.push(task.id)
  if (recentIds.value.length > MAX_RECENT) recentIds.value.shift()
}

function close() {
  isOpen.value = false
  currentTask.value = null
}

// ── Composable ───────────────────────────────────────────────────

export function useRandomizerStore() {
  return { isOpen, currentTask, open, shuffle, close }
}
