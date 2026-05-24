import { ref } from 'vue'
import type { MovieInfo } from '../services/tmdb.service'
import type { RecipeInfo } from '../services/mealDB.service'

export interface EnglishWordSet {
  words: Array<{ en: string; ru: string }>
}

export type TaskDetail =
  | { type: 'movie';   data: MovieInfo }
  | { type: 'recipe';  data: RecipeInfo }
  | { type: 'drawing'; data: { topic: string } }
  | { type: 'walk';    data: { park: string } }
  | { type: 'words';   data: EnglishWordSet }

interface StoredDetail {
  detail: TaskDetail
  date: string
}

const STORAGE_KEY = 'pettasks:taskdetails'

function todayStr(): string {
  return new Date().toLocaleDateString('ru-RU')
}

function load(): Record<string, StoredDetail> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function persist(map: Record<string, StoredDetail>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

// ── Синглтон-состояние ───────────────────────────────────────────

const stored = ref<Record<string, StoredDetail>>(load())

// Чистим устаревшие записи при старте
;(function pruneOld() {
  const today = todayStr()
  let changed = false
  for (const key of Object.keys(stored.value)) {
    if (stored.value[key].date !== today) {
      delete stored.value[key]
      changed = true
    }
  }
  if (changed) persist(stored.value)
})()

function get(taskId: string): TaskDetail | null {
  const entry = stored.value[taskId]
  if (!entry) return null
  if (entry.date !== todayStr()) {
    remove(taskId)
    return null
  }
  return entry.detail
}

function set(taskId: string, detail: TaskDetail) {
  stored.value[taskId] = { detail, date: todayStr() }
  persist(stored.value)
}

function remove(taskId: string) {
  delete stored.value[taskId]
  persist(stored.value)
}

// ── Composable ───────────────────────────────────────────────────

export function useTaskDetailStore() {
  return { get, set, remove }
}
