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
    <!-- ── Верхняя строка: иконка + название + кнопка Готово ── -->
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
        <!-- Бонусы — на десктопе здесь, на мобильном переедут вниз через CSS -->
        <div class="task-bonuses task-bonuses--inline">
          <span v-if="task.satietyBonus > 0"   class="bonus bonus--satiety">🍖 +{{ task.satietyBonus }}</span>
          <span v-if="task.happinessBonus > 0" class="bonus bonus--happiness">✨ +{{ task.happinessBonus }}</span>
          <span v-if="hasSavedDetail"           class="bonus bonus--saved">💾</span>
          <span v-if="task.isCustom"            class="bonus bonus--custom">👤</span>
        </div>
      </div>

      <!-- Кнопка Готово — всегда видна -->
      <button
        class="task-btn"
        @click.stop="complete"
        :disabled="justDone"
      >{{ justDone ? '✓' : 'Готово' }}</button>
    </div>

    <!-- ── Нижняя строка: действия (редкий клик) ── -->
    <div class="task-footer" @click.stop>
      <div class="task-bonuses task-bonuses--footer">
        <span v-if="task.satietyBonus > 0"   class="bonus bonus--satiety">🍖 +{{ task.satietyBonus }}</span>
        <span v-if="task.happinessBonus > 0" class="bonus bonus--happiness">✨ +{{ task.happinessBonus }}</span>
        <span v-if="hasSavedDetail"           class="bonus bonus--saved">💾 уточнение</span>
        <span v-if="task.isCustom"            class="bonus bonus--custom">👤 своя</span>
      </div>
      <div class="task-actions">
        <button v-if="hasDetail"  class="icon-action"                     @click="$emit('open-detail', task)" title="Подробнее">🔍</button>
        <button                   class="icon-action"                     @click="$emit('edit', task)"        title="Редактировать">✏️</button>
        <button                   class="icon-action icon-action--danger"  @click="$emit('delete', task)"
          :title="task.isCustom ? 'Удалить' : 'Убрать из списка'">🗑️</button>
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
/* ── Карточка ─────────────────────────────────────────────── */
.task-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  transition: border-color 0.25s, transform 0.25s;
  overflow: hidden;
}

.task-card--clickable { cursor: pointer; }
.task-card--clickable:hover { border-color: var(--accent); }
.task-card--done       { opacity: 0.6; }
.task-card--productive { border-left: 4px solid var(--color-satiety); }
.task-card--fun        { border-left: 4px solid var(--color-happiness); }
.task-card--custom     { border-left: 4px solid var(--accent) !important; }

/* ── Верхняя строка ───────────────────────────────────────── */
.task-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem 0;
}

.task-icon {
  font-size: 1.4rem;
  min-width: 2rem; width: 2rem; height: 2rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.task-icon-img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
[data-theme="dark"] .task-icon--flag { filter: brightness(1.9) saturate(0.9); }

.task-body {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* Бонусы-инлайн — видны на десктопе под названием, скрыты на мобильном */
.task-bonuses { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.task-bonuses--inline { margin-top: 3px; }

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

/* ── Кнопка Готово ────────────────────────────────────────── */
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

/* ── Нижняя строка: бонусы + действия ────────────────────── */
.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.85rem 0.65rem;
  gap: 0.5rem;
}

/* Бонусы в футере — скрыты на десктопе, видны только на мобильном */
.task-bonuses--footer { display: none; }

.task-actions { display: flex; align-items: center; gap: 0.3rem; margin-left: auto; }

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
.icon-action:hover         { background: var(--bg-hover); border-color: var(--accent); }
.icon-action--danger:hover { border-color: #ef4444; }

/* ── ДЕСКТОП (> 600px) ────────────────────────────────────── */
@media (min-width: 600px) {
  /* На десктопе возвращаем горизонтальный однострочный вид */
  .task-card {
    flex-direction: row;
    align-items: center;
    padding: 0.75rem 0.85rem;
    gap: 0.75rem;
  }

  .task-main {
    flex: 1;
    min-width: 0;
    padding: 0;
    gap: 0.75rem;
  }

  /* Нижняя строка на десктопе не нужна как отдельный блок —
     прячем футер-бонусы, показываем inline-бонусы */
  .task-footer {
    padding: 0;
    flex-shrink: 0;
  }

  .task-bonuses--inline  { display: flex; }
  .task-bonuses--footer  { display: none; }

  .task-card--clickable:hover { transform: translateX(3px); }
}

/* ── МОБИЛЬНЫЙ (≤ 599px) ──────────────────────────────────── */
@media (max-width: 599px) {
  .task-card {
    flex-direction: column;
  }

  .task-main {
    padding: 0.7rem 0.75rem 0;
    gap: 0.6rem;
  }

  /* На мобильном показываем бонусы только в футере, inline скрываем */
  .task-bonuses--inline  { display: none; }
  .task-bonuses--footer  { display: flex; flex: 1; }

  .task-footer {
    padding: 0.35rem 0.75rem 0.65rem;
    border-top: 1px solid var(--border);
    margin-top: 0.4rem;
  }

  /* Кнопка Готово — немного меньше на мобильном */
  .task-btn {
    padding: 0.38rem 0.7rem;
    font-size: 0.8rem;
  }

  /* Иконки действий чуть крупнее для удобства тапа */
  .icon-action {
    padding: 0.3rem 0.5rem;
    font-size: 0.88rem;
  }

  /* Без эффекта сдвига на тач-устройствах */
  .task-card--clickable:hover { transform: none; }
}
</style>
