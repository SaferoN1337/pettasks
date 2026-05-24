<template>
  <Modal v-model="isOpen" title="🎲 Твоё задание" :closable="true">
    <div v-if="currentTask" class="suggestion">

      <div class="sug-icon">{{ currentTask.icon }}</div>
      <div class="sug-title">{{ currentTask.title }}</div>

      <div class="sug-bonuses">
        <span v-if="currentTask.satietyBonus > 0"   class="bonus bonus--s">🍖 +{{ currentTask.satietyBonus }} к сытости</span>
        <span v-if="currentTask.happinessBonus > 0" class="bonus bonus--h">✨ +{{ currentTask.happinessBonus }} к счастью</span>
      </div>

      <div v-if="loading" class="api-loading">
        <span class="loading-spinner">⏳</span> Загружаем детали…
      </div>

      <div v-else-if="detail" class="api-block">

        <!-- Фильм -->
        <template v-if="detail.type === 'movie'">
          <img v-if="detail.data.posterUrl" :src="detail.data.posterUrl" class="api-poster" alt="постер" />
          <div class="api-title">
            <span>{{ showRaw ? detail.data.titleRaw : detail.data.title }}</span>
            <span class="api-year">({{ detail.data.year }})</span>
          </div>
          <div class="api-subtitle">
            ⭐ {{ detail.data.rating }}
            <span v-if="detail.data.translated" class="translated-badge">🇷🇺 переведено</span>
          </div>
          <div class="api-text">{{ showRaw ? (detail.data.overviewRaw || detail.data.overview) : detail.data.overview }}</div>
          <div class="extra-actions">
            <button v-if="detail.data.translated" class="btn-toggle-raw" @click="showRaw = !showRaw">
              {{ showRaw ? '🇷🇺 Перевод' : '🇬🇧 Оригинал' }}
            </button>
          </div>
        </template>

        <!-- Рецепт -->
        <template v-else-if="detail.type === 'recipe'">
          <img v-if="detail.data.imageUrl" :src="detail.data.imageUrl" class="api-poster" alt="блюдо" />
          <div class="api-title">{{ showRaw ? detail.data.nameRaw : detail.data.name }}</div>
          <div class="api-subtitle">
            Категория: {{ detail.data.category }}
            <span v-if="detail.data.translated" class="translated-badge">🇷🇺 переведено</span>
          </div>
          <div class="ing-list">
            <div v-for="(ing, idx) in (showRaw ? detail.data.ingredientsRaw : detail.data.ingredients)" :key="idx" class="ing-item">• {{ ing }}</div>
          </div>
          <div class="api-text">{{ showRaw ? detail.data.instructionsRaw : detail.data.instructions }}</div>
          <div class="extra-actions">
            <button v-if="detail.data.translated" class="btn-toggle-raw" @click="showRaw = !showRaw">
              {{ showRaw ? '🇷🇺 Перевод' : '🇬🇧 Оригинал' }}
            </button>
          </div>
        </template>

        <!-- Рисование -->
        <template v-else-if="detail.type === 'drawing'">
          <div class="api-title">🎨 Тема: «{{ detail.data.topic }}»</div>
          <div class="api-text">Нарисуй всё что придёт в голову. Не бойся экспериментировать!</div>
        </template>

        <!-- Прогулка -->
        <template v-else-if="detail.type === 'walk'">
          <div class="api-title">📍 {{ detail.data.park }}</div>
          <div class="api-text">Выйди на прогулку! Свежий воздух творит чудеса 🌿</div>
        </template>

        <!-- Слова -->
        <template v-else-if="detail.type === 'words'">
          <div class="words-list">
            <div v-for="(word, i) in detail.data.words" :key="word.en" class="word-item">
              <span class="word-num">{{ i + 1 }}</span>
              <span class="word-en">{{ word.en }}</span>
              <span class="word-arrow">→</span>
              <span class="word-ru">{{ word.ru }}</span>
            </div>
          </div>
        </template>

      </div>

      <div class="sug-actions">
        <button class="btn btn--done"    @click="markDone">✓ Сделано!</button>
        <button class="btn btn--shuffle" @click="another">🔀 Другой вариант</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { watch, ref, computed } from 'vue'
import Modal from '../common/Modal.vue'
import type { Task } from '../../types/task.types'
import { useRandomizerStore } from '../../stores/randomizer.store'
import { useTasksStore } from '../../stores/tasks.store'
import { useTaskDetailStore } from '../../stores/taskDetail.store'
import type { TaskDetail } from '../../stores/taskDetail.store'
import { getRandomMovie } from '../../services/tmdb.service'
import { getRandomRecipe } from '../../services/mealDB.service'
import { getRandomWords } from '../../services/words.service'
import { drawingTopics, parkSuggestions } from '../../data/drawingTopics'

const randomizerStore = useRandomizerStore()
const tasksStore      = useTasksStore()
const detailStore     = useTaskDetailStore()

// ── Извлекаем примитивные значения из Ref/ComputedRef ─────────────
// Modal ожидает boolean, поэтому используем computed который возвращает boolean
const isOpen = computed<boolean>({
  get: () => randomizerStore.isOpen.value,
  set: (v: boolean) => { randomizerStore.isOpen.value = v },
})

// currentTask — Task | null (не Ref)
const currentTask = computed<Task | null>(() => randomizerStore.currentTask.value)

const showRaw = ref(false)
const loading = ref(false)
const detail  = ref<TaskDetail | null>(null)

// Следим за сменой задачи
watch(currentTask, async (t: Task | null) => {
  showRaw.value = false
  if (!t) { detail.value = null; return }

  // Сначала смотрим кэш
  const saved = detailStore.get(t.id)
  if (saved) { detail.value = saved; return }

  // Нет API-уточнения для этой задачи
  if (!t.apiType && t.id !== 'p3') { detail.value = null; return }

  loading.value = true
  detail.value  = null

  try {
    let newDetail: TaskDetail | null = null

    if (t.apiType === 'movie') {
      const watched = JSON.parse(localStorage.getItem('pettasks:movie_watched') || '[]') as string[]
      const skipped = JSON.parse(localStorage.getItem('pettasks:movie_skipped') || '[]') as string[]
      const movie = await getRandomMovie([...new Set([...watched, ...skipped])])
      if (movie) newDetail = { type: 'movie', data: movie }

    } else if (t.apiType === 'recipe') {
      const recipe = await getRandomRecipe()
      if (recipe) newDetail = { type: 'recipe', data: recipe }

    } else if (t.apiType === 'drawing') {
      const topic = drawingTopics[Math.floor(Math.random() * drawingTopics.length)]
      newDetail = { type: 'drawing', data: { topic } }

    } else if (t.apiType === 'walk') {
      const park = parkSuggestions[Math.floor(Math.random() * parkSuggestions.length)]
      newDetail = { type: 'walk', data: { park } }

    } else if (t.id === 'p3') {
      const words = await getRandomWords()
      newDetail = { type: 'words', data: { words } }
    }

    if (newDetail) {
      detail.value = newDetail
      detailStore.set(t.id, newDetail)
    }
  } catch (e) {
    console.warn('API ошибка:', e)
  } finally {
    loading.value = false
  }
}, { immediate: true })

function markDone() {
  const t = currentTask.value
  if (t) {
    detailStore.remove(t.id)
    tasksStore.completeTask(t)
  }
  randomizerStore.close()
}

function another() {
  const t = currentTask.value
  if (t) {
    // Добавляем текущий фильм в пропущенные
    if (detail.value?.type === 'movie') {
      const title = detail.value.data.titleRaw || detail.value.data.title
      const list = JSON.parse(localStorage.getItem('pettasks:movie_skipped') || '[]') as string[]
      list.unshift(title)
      localStorage.setItem('pettasks:movie_skipped', JSON.stringify(list.slice(0, 20)))
    }
    detailStore.remove(t.id)
  }
  randomizerStore.shuffle()
}
</script>

<style scoped>
.suggestion {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.sug-icon  { font-size: 3rem; }
.sug-title { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }

.sug-bonuses { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }

.bonus { padding: 3px 10px; border-radius: 999px; font-size: 0.82rem; font-weight: 600; }
.bonus--s { background: rgba(34,197,94,0.15);  color: #4ade80; }
.bonus--h { background: rgba(251,146,60,0.15); color: #fb923c; }

.api-loading { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem; padding: 0.5rem 0; }
.loading-spinner { animation: spin 1.2s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.api-block {
  width: 100%;
  background: var(--bg-option);
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;
}

.api-poster { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; }

.api-title   { font-weight: 700; color: var(--text-primary); font-size: 1rem; display: flex; align-items: baseline; gap: 0.3rem; flex-wrap: wrap; }
.api-year    { font-weight: 400; color: var(--text-muted); font-size: 0.88rem; }
.api-original { font-size: 0.78rem; color: var(--text-muted); font-style: italic; }
.api-subtitle { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.api-text    { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }

.translated-badge { font-size: 0.72rem; background: rgba(99,102,241,0.15); color: #818cf8; padding: 1px 6px; border-radius: 999px; font-weight: 600; }

.ing-list { display: flex; flex-direction: column; gap: 2px; }
.ing-item { font-size: 0.82rem; color: var(--text-secondary); }

.words-list { display: flex; flex-direction: column; gap: 0.35rem; width: 100%; }
.word-item  { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-card); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.88rem; }
.word-num   { color: var(--text-muted); min-width: 16px; font-size: 0.78rem; }
.word-en    { font-weight: 700; color: var(--accent); min-width: 110px; }
.word-arrow { color: var(--text-muted); }
.word-ru    { color: var(--text-primary); flex: 1; }

.btn-toggle-raw {
  align-self: flex-start;
  background: rgba(99,102,241,0.08);
  border: 1.5px solid rgba(99,102,241,0.4);
  border-radius: 8px;
  padding: 0.3rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #818cf8;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-toggle-raw:hover { background: rgba(99,102,241,0.18); }
.extra-actions { display: flex; gap: 0.5rem; }

.sug-actions { display: flex; gap: 0.75rem; width: 100%; margin-top: 0.25rem; }

.btn { flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; transition: all 0.2s; }
.btn--done    { background: var(--color-satiety); color: #fff; }
.btn--done:hover { filter: brightness(1.1); }
.btn--shuffle { background: var(--bg-option); border: 1.5px solid var(--border); color: var(--text-secondary); }
.btn--shuffle:hover { background: var(--bg-hover); }
</style>
