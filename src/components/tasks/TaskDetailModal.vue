<template>
  <Modal v-model="isOpen" :title="task ? `${isImageIcon ? '' : task.icon} ${task.title}` : ''" :closable="true">
    <div v-if="task" class="detail-wrap">

      <div v-if="isImageIcon" class="custom-icon-header">
        <img :src="task.icon" alt="иконка" class="custom-icon-img" />
      </div>

      <div class="sug-bonuses">
        <span v-if="task.satietyBonus > 0"   class="bonus bonus--s">🍖 +{{ task.satietyBonus }} к сытости</span>
        <span v-if="task.happinessBonus > 0" class="bonus bonus--h">✨ +{{ task.happinessBonus }} к счастью</span>
      </div>

      <div v-if="task.isCustom && task.description" class="custom-desc">{{ task.description }}</div>

      <div v-if="loading" class="api-loading"><span class="loading-spinner">⏳</span> Загружаем детали…</div>

      <div v-else-if="detail" class="api-block">

        <!-- 🎬 Фильм -->
        <template v-if="detail.type === 'movie'">
          <img v-if="detail.data.posterUrl" :src="detail.data.posterUrl" class="api-poster" alt="постер" />
          <div class="api-title">
            <span v-if="!showRaw">{{ detail.data.title }}</span>
            <span v-else>{{ detail.data.titleRaw }}</span>
            <span class="api-year">({{ detail.data.year }})</span>
          </div>
          <div class="api-subtitle">
            ⭐ {{ detail.data.rating }}
            <span v-if="detail.data.translated" class="translated-badge">🇷🇺 переведено</span>
          </div>
          <div class="api-text">
            <span v-if="!showRaw">{{ detail.data.overview }}</span>
            <span v-else>{{ detail.data.overviewRaw || detail.data.overview }}</span>
          </div>
          <div class="action-row">
            <button class="btn-refresh" @click="refreshContent">🔀 Другой фильм</button>
            <button class="btn-watched" @click="markWatched">👁 Уже смотрел</button>
            <button v-if="detail.data.translated" class="btn-toggle-raw" @click="showRaw = !showRaw">
              {{ showRaw ? '🇷🇺 Перевод' : '🇬🇧 Оригинал' }}
            </button>
          </div>
        </template>

        <!-- 🍽️ Рецепт -->
        <template v-else-if="detail.type === 'recipe'">
          <img v-if="detail.data.imageUrl" :src="detail.data.imageUrl" class="api-poster" alt="блюдо" />
          <div class="api-title">
            <span>{{ showRaw ? detail.data.nameRaw : detail.data.name }}</span>
          </div>
          <div class="api-subtitle">
            Категория: {{ detail.data.category }}
            <span v-if="detail.data.translated" class="translated-badge">🇷🇺 переведено</span>
          </div>
          <div class="ing-header">Ингредиенты:</div>
          <div class="api-ingredients">
            <div v-for="(ing, idx) in (showRaw ? detail.data.ingredientsRaw : detail.data.ingredients)" :key="idx" class="ing-item">• {{ ing }}</div>
          </div>
          <div class="ing-header" style="margin-top:.5rem">Приготовление:</div>
          <div class="api-text">{{ showRaw ? detail.data.instructionsRaw : detail.data.instructions }}</div>
          <div class="action-row">
            <button class="btn-refresh" @click="refreshContent">🔀 Другой рецепт</button>
            <button v-if="detail.data.translated" class="btn-toggle-raw" @click="showRaw = !showRaw">
              {{ showRaw ? '🇷🇺 Перевод' : '🇬🇧 Оригинал' }}
            </button>
          </div>
        </template>

        <!-- 🎨 Рисование -->
        <template v-else-if="detail.type === 'drawing'">
          <div class="drawing-card">
            <div class="drawing-emoji">🎨</div>
            <div class="api-title">Тема: «{{ detail.data.topic }}»</div>
            <div class="api-text">Нарисуй всё, что приходит в голову. Не бойся экспериментировать!</div>
          </div>
          <button class="btn-refresh" @click="refreshContent">🔀 Другая тема</button>
        </template>

        <!-- 🌳 Прогулка -->
        <template v-else-if="detail.type === 'walk'">
          <div class="drawing-card">
            <div class="drawing-emoji">🌳</div>
            <div class="api-title">📍 {{ detail.data.park }}</div>
            <div class="api-text">Выйди на прогулку! Минимум 30 минут пешком 🌿</div>
          </div>
          <button class="btn-refresh" @click="refreshContent">🔀 Другое место</button>
        </template>

        <!-- 🇬🇧 Слова -->
        <template v-else-if="detail.type === 'words'">
          <div class="words-header">Сегодня учим эти 5 слов:</div>
          <div class="words-list">
            <div v-for="(word, i) in detail.data.words" :key="word.en" class="word-item">
              <span class="word-num">{{ i + 1 }}</span>
              <span class="word-en">{{ word.en }}</span>
              <span class="word-arrow">→</span>
              <span class="word-ru">{{ word.ru }}</span>
            </div>
          </div>
          <div class="api-text" style="margin-top:.5rem">Попробуй составить предложение с каждым словом!</div>
          <button class="btn-refresh" @click="refreshContent">🔀 Другие слова</button>
        </template>

      </div>

      <button class="btn-done" @click="markDone">✓ Выполнено! Засчитать питомцу</button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '../common/Modal.vue'
import type { Task } from '../../types/task.types'
import { useTasksStore } from '../../stores/tasks.store'
import { useTaskDetailStore } from '../../stores/taskDetail.store'
import type { TaskDetail } from '../../stores/taskDetail.store'
import { getRandomMovie } from '../../services/tmdb.service'
import { getRandomRecipe } from '../../services/mealDB.service'
import { getRandomWords } from '../../services/words.service'
import { drawingTopics, parkSuggestions } from '../../data/drawingTopics'

const props = defineProps<{ modelValue: boolean; task: Task | null }>()
const emit  = defineEmits<{ (e: 'update:modelValue', val: boolean): void }>()

const tasksStore  = useTasksStore()
const detailStore = useTaskDetailStore()

const isOpen  = ref(props.modelValue)
const loading = ref(false)
const detail  = ref<TaskDetail | null>(null)
const showRaw = ref(false)    // переключатель оригинал/перевод

// Постоянные списки для фильмов
const SKIPPED_KEY = 'pettasks:movie_skipped'   // последние 15-20 пропущенных
const WATCHED_KEY = 'pettasks:movie_watched'   // просмотренные

function loadMovieList(key: string): string[] {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r) } catch {}
  return []
}

watch(() => props.modelValue, v => { isOpen.value = v })
watch(isOpen, v => { emit('update:modelValue', v); if (!v) showRaw.value = false })

const isImageIcon = computed(() =>
  !!props.task?.icon && (props.task.icon.startsWith('data:') || props.task.icon.startsWith('http'))
)

watch(() => [props.modelValue, props.task] as const, ([open, t]) => {
  if (!open || !t) return
  showRaw.value = false
  loadDetail(t, false)
}, { immediate: true })

async function loadDetail(t: Task, forceRefresh: boolean) {
  if (!forceRefresh) {
    const saved = detailStore.get(t.id)
    if (saved) { detail.value = saved; return }
  }
  if (!t.apiType && t.id !== 'p3') { detail.value = null; return }

  detail.value = null
  loading.value = true

  try {
    let newDetail: TaskDetail | null = null

    if (t.apiType === 'movie') {
      const watched = loadMovieList(WATCHED_KEY)
      const skipped = loadMovieList(SKIPPED_KEY)
      const exclude = [...new Set([...watched, ...skipped])]
      const movie = await getRandomMovie(exclude)
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

    if (newDetail) { detail.value = newDetail; detailStore.set(t.id, newDetail) }
  } catch (e) {
    console.warn('Ошибка загрузки деталей:', e)
  } finally {
    loading.value = false
  }
}

function addToSkipped(title: string) {
  const list = loadMovieList(SKIPPED_KEY)
  list.unshift(title)
  localStorage.setItem(SKIPPED_KEY, JSON.stringify(list.slice(0, 20)))
}

function markWatched() {
  if (detail.value?.type !== 'movie') return
  const title = detail.value.data.titleRaw || detail.value.data.title
  const list = loadMovieList(WATCHED_KEY)
  if (!list.includes(title)) {
    list.push(title)
    localStorage.setItem(WATCHED_KEY, JSON.stringify(list))
  }
  detailStore.remove(props.task!.id)
  loadDetail(props.task!, true)
}

async function refreshContent() {
  if (!props.task) return
  // Добавляем текущий фильм в список пропущенных
  if (detail.value?.type === 'movie') {
    const title = (detail.value.data as any).titleRaw || detail.value.data.title
    addToSkipped(title)
  }
  detailStore.remove(props.task.id)
  showRaw.value = false
  await loadDetail(props.task, true)
}

function markDone() {
  if (props.task) { detailStore.remove(props.task.id); tasksStore.completeTask(props.task) }
  isOpen.value = false
}
</script>

<style scoped>
.detail-wrap { display: flex; flex-direction: column; gap: 0.75rem; }

.custom-icon-header { display: flex; justify-content: center; margin-bottom: 0.25rem; }
.custom-icon-img    { width: 72px; height: 72px; object-fit: cover; border-radius: 16px; border: 2px solid var(--border); }

.sug-bonuses { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.bonus { padding: 3px 10px; border-radius: 999px; font-size: 0.82rem; font-weight: 600; }
.bonus--s { background: rgba(34,197,94,0.15);  color: #4ade80; }
.bonus--h { background: rgba(251,146,60,0.15); color: #fb923c; }

.custom-desc { background: var(--bg-option); border-radius: 10px; padding: .65rem .85rem; font-size: .9rem; color: var(--text-secondary); line-height: 1.5; border-left: 3px solid var(--accent); }

.api-loading { display: flex; align-items: center; gap: .5rem; color: var(--text-muted); font-size: .9rem; padding: 1rem 0; }
.loading-spinner { animation: spin 1.2s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.api-block { display: flex; flex-direction: column; gap: .5rem; }

.api-poster { width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px; }

.api-title { font-weight: 700; color: var(--text-primary); font-size: 1.05rem; line-height: 1.3; display: flex; align-items: baseline; gap: .35rem; flex-wrap: wrap; }
.api-year  { font-weight: 400; color: var(--text-muted); font-size: .88rem; }
.api-original { font-size: .78rem; color: var(--text-muted); font-style: italic; }
.api-subtitle { font-size: .82rem; color: var(--text-muted); display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
.api-text { font-size: .87rem; color: var(--text-secondary); line-height: 1.6; }

.translated-badge { font-size: .72rem; background: rgba(99,102,241,.15); color: #818cf8; padding: 1px 6px; border-radius: 999px; font-weight: 600; }

.ing-header { font-size: .82rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; }
.api-ingredients { display: flex; flex-direction: column; gap: 2px; }
.ing-item { font-size: .85rem; color: var(--text-secondary); padding: 1px 0; }

.drawing-card { background: var(--bg-option); border-radius: 14px; padding: 1.25rem; text-align: center; display: flex; flex-direction: column; gap: .5rem; align-items: center; }
.drawing-emoji { font-size: 2.5rem; }

.words-header { font-size: .85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; }
.words-list   { display: flex; flex-direction: column; gap: .4rem; }
.word-item    { display: flex; align-items: center; gap: .6rem; background: var(--bg-option); border-radius: 10px; padding: .5rem .75rem; font-size: .9rem; }
.word-num     { color: var(--text-muted); min-width: 18px; font-size: .8rem; }
.word-en      { font-weight: 700; color: var(--accent); min-width: 110px; }
.word-arrow   { color: var(--text-muted); }
.word-ru      { color: var(--text-primary); flex: 1; }

/* Ряд кнопок действий */
.action-row { display: flex; gap: .5rem; flex-wrap: wrap; }

.btn-refresh, .btn-watched, .btn-toggle-raw {
  background: var(--bg-option);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: .4rem .85rem;
  font-size: .82rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all .2s;
}
.btn-refresh:hover, .btn-watched:hover, .btn-toggle-raw:hover {
  background: var(--bg-hover); border-color: var(--accent); color: var(--text-primary);
}
.btn-watched { border-color: var(--color-happiness); color: var(--color-happiness); background: rgba(251,146,60,.08); }
.btn-watched:hover { background: rgba(251,146,60,.18); }
.btn-toggle-raw { border-color: rgba(99,102,241,.5); color: #818cf8; background: rgba(99,102,241,.08); }
.btn-toggle-raw:hover { background: rgba(99,102,241,.18); }

.btn-done { width: 100%; padding: .8rem; background: var(--color-satiety); color: #fff; border: none; border-radius: 12px; font-weight: 700; font-size: .95rem; cursor: pointer; transition: all .2s; margin-top: .25rem; }
.btn-done:hover { filter: brightness(1.1); transform: translateY(-1px); }
</style>
