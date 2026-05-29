<template>
  <div
    class="task-card"
    :class="{
      'task-card--productive': task.category === 'productive',
      'task-card--fun':        task.category === 'fun',
      'task-card--done':       justDone,
      'task-card--clickable':  hasDetail,
      'task-card--custom':     task.isCustom,
    }"
    @click="hasDetail ? $emit('open-detail', task) : undefined"
  >
    <!-- ── Верхняя строка: иконка + название + кнопка Готово (только мобильный) ── -->
    <div class="task-main">
      <div
        class="task-icon"
        :class="{ 'task-icon--flag': task.id === 'p3', 'task-icon--img': isImageIcon }"
      >
        <img v-if="isImageIcon" :src="task.icon" alt="иконка" class="task-icon-img" />
        <span v-else>{{ task.icon }}</span>
      </div>

      <div class="task-body">
        <div class="task-title">{{ task.title }}</div>
        <!-- Бонусы под названием — только десктоп -->
        <div class="task-bonuses task-bonuses--desktop">
          <span v-if="task.satietyBonus > 0"   class="bonus bonus--satiety">🍖 +{{ task.satietyBonus }}</span>
          <span v-if="task.happinessBonus > 0" class="bonus bonus--happiness">✨ +{{ task.happinessBonus }}</span>
          <span v-if="hasSavedDetail"           class="bonus bonus--saved">💾 уточнение</span>
          <span v-if="task.isCustom"            class="bonus bonus--custom">👤 своя</span>
        </div>
      </div>

      <!-- Кнопка Готово — только на мобильном (верхняя строка) -->
      <button class="task-btn task-btn--mobile" @click.stop="complete" :disabled="justDone">
        {{ justDone ? '✓' : 'Готово' }}
      </button>
    </div>

    <!-- ── Нижняя строка / правый блок: бонусы (мобильный) + действия + Готово (десктоп) ── -->
    <div class="task-footer" @click.stop>
      <!-- Бонусы — только на мобильном -->
      <div class="task-bonuses task-bonuses--mobile">
        <span v-if="task.satietyBonus > 0"   class="bonus bonus--satiety">🍖 +{{ task.satietyBonus }}</span>
        <span v-if="task.happinessBonus > 0" class="bonus bonus--happiness">✨ +{{ task.happinessBonus }}</span>
        <span v-if="hasSavedDetail"           class="bonus bonus--saved">💾</span>
        <span v-if="task.isCustom"            class="bonus bonus--custom">👤</span>
      </div>

      <div class="task-actions">
        <button v-if="hasDetail"  class="icon-action"                    @click="$emit('open-detail', task)" title="Подробнее">🔍</button>
        <button                   class="icon-action"                    @click="$emit('edit', task)"        title="Редактировать">✏️</button>
        <button                   class="icon-action icon-action--danger" @click="$emit('delete', task)"
          :title="task.isCustom ? 'Удалить' : 'Убрать из списка'">🗑️</button>

        <!-- Кнопка Готово — только на десктопе (правый край) -->
        <button class="task-btn task-btn--desktop" @click.stop="complete" :disabled="justDone">
          {{ justDone ? '✓' : 'Готово' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task } from '../../types/task.types'
import { useTasksStore } from '../../stores/tasks.store'
import { useTaskDetailStore } from '../../stores/taskDetail.store'

const props = defineProps<{ task: Task }>()
const emit  = defineEmits<{
  (e: 'open-detail', task: Task): void
  (e: 'edit',        task: Task): void
  (e: 'delete',      task: Task): void
}>()

const tasksStore  = useTasksStore()
const detailStore = useTaskDetailStore()
const justDone    = ref(false)

const isImageIcon = computed<boolean>(() =>
  props.task.icon.startsWith('data:') || props.task.icon.startsWith('http')
)
const hasDetail = computed<boolean>(() =>
  !!props.task.apiType ||
  props.task.id === 'p3' ||
  !!(props.task.isCustom && props.task.description)
)
const hasSavedDetail = computed<boolean>(() =>
  hasDetail.value && detailStore.get(props.task.id) !== null
)

function complete() {
  if (justDone.value) return
  detailStore.remove(props.task.id)
  tasksStore.completeTask(props.task)
  justDone.value = true
  setTimeout(() => { justDone.value = false }, 3000)
}
</script>

<style scoped>
/* ── Базовые стили карточки ───────────────────────────────── */
.task-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  transition: border-color 0.25s, transform 0.25s;
  overflow: hidden;
}
.task-card--clickable      { cursor: pointer; }
.task-card--done           { opacity: 0.6; }
.task-card--productive     { border-left: 4px solid var(--color-satiety); }
.task-card--fun            { border-left: 4px solid var(--color-happiness); }
.task-card--custom         { border-left: 4px solid var(--accent) !important; }

/* ── Иконка задачи ────────────────────────────────────────── */
.task-icon {
  font-size: 1.4rem;
  min-width: 2rem; width: 2rem; height: 2rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.task-icon-img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
[data-theme="dark"] .task-icon--flag { filter: brightness(1.9) saturate(0.9); }

/* ── Тело задачи ──────────────────────────────────────────── */
.task-body { flex: 1; min-width: 0; }

.task-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* ── Бонусы ───────────────────────────────────────────────── */
.task-bonuses { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.bonus {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}
.bonus--satiety   { background: rgba(34,197,94,0.15);  color: #4ade80; }
.bonus--happiness { background: rgba(251,146,60,0.15); color: #fb923c; }
.bonus--saved     { background: rgba(99,102,241,0.15); color: #818cf8; }
.bonus--custom    { background: rgba(99,102,241,0.1);  color: #a5b4fc; }

/* ── Кнопка Готово (общие стили) ──────────────────────────── */
.task-btn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.task-btn:hover:not(:disabled) { filter: brightness(1.1); }
.task-btn:disabled { background: var(--color-satiety); cursor: default; }

/* ── Кнопки действий ──────────────────────────────────────── */
.task-actions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.icon-action {
  background: var(--bg-option);
  border: 1.5px solid var(--border);
  border-radius: 7px;
  padding: 0.25rem 0.4rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}
.icon-action:hover          { background: var(--bg-hover); border-color: var(--accent); }
.icon-action--danger:hover  { border-color: #ef4444; }

/* ══════════════════════════════════════════════════════════════
   ДЕСКТОП (≥ 600px):
   горизонтальный однострочный вид
   [icon][title+bonuses]  →  [🔍][✏️][🗑️][Готово]
   ══════════════════════════════════════════════════════════════ */
@media (min-width: 600px) {
  .task-card {
    flex-direction: row;
    align-items: center;
    padding: 0.7rem 0.85rem;
    gap: 0.75rem;
  }
  .task-card--clickable:hover { transform: translateX(3px); }

  /* Верхняя строка = иконка + тело (растягивается) */
  .task-main {
    display: contents; /* «растворяем» обёртку — дети встают в поток card */
  }

  /* Нижняя строка = правый блок с действиями */
  .task-footer {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    margin-left: auto;
  }

  .task-body { flex: 1; }

  /* Бонусы под названием — показываем только здесь */
  .task-bonuses--desktop { display: flex; margin-top: 3px; }
  .task-bonuses--mobile  { display: none; }

  /* Кнопка мобильная — скрыта */
  .task-btn--mobile  { display: none; }
  /* Кнопка десктопная — видна, стоит последней в actions */
  .task-btn--desktop { display: inline-flex; align-items: center; }
}

/* ══════════════════════════════════════════════════════════════
   МОБИЛЬНЫЙ (< 600px):
   двухстрочный вид
   Строка 1: [icon][title]                    [Готово]
   ────────────────────────────────────────────────────
   Строка 2: [🍖+15][✨+5]         [🔍][✏️][🗑️]
   ══════════════════════════════════════════════════════════════ */
@media (max-width: 599px) {
  .task-card { flex-direction: column; }

  /* Верхняя строка */
  .task-main {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 0.75rem 0;
  }

  /* Нижняя строка */
  .task-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.35rem 0.75rem 0.65rem;
    border-top: 1px solid var(--border);
    margin-top: 0.4rem;
    gap: 0.5rem;
  }

  /* Бонусы: под названием скрыты, в футере видны */
  .task-bonuses--desktop { display: none; }
  .task-bonuses--mobile  { display: flex; flex: 1; }

  /* Кнопка мобильная — видна в верхней строке */
  .task-btn--mobile  { display: inline-flex; align-items: center; }
  /* Кнопка десктопная — скрыта */
  .task-btn--desktop { display: none; }

  /* Крупнее для удобства тапа */
  .icon-action { padding: 0.3rem 0.5rem; font-size: 0.88rem; }
  .task-btn    { padding: 0.38rem 0.7rem; font-size: 0.8rem; }

  /* Без эффекта сдвига на тач */
  .task-card--clickable:hover { transform: none; }
}
</style>
