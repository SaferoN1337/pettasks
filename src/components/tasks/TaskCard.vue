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
    <div
      class="task-icon"
      :class="{ 'task-icon--flag': task.id === 'p3', 'task-icon--img': isImageIcon }"
    >
      <img v-if="isImageIcon" :src="task.icon" alt="иконка" class="task-icon-img" />
      <span v-else>{{ task.icon }}</span>
    </div>

    <div class="task-body">
      <div class="task-title">{{ task.title }}</div>
      <div class="task-bonuses">
        <span v-if="task.satietyBonus > 0"   class="bonus bonus--satiety">🍖 +{{ task.satietyBonus }}</span>
        <span v-if="task.happinessBonus > 0" class="bonus bonus--happiness">✨ +{{ task.happinessBonus }}</span>
        <span v-if="hasSavedDetail"           class="bonus bonus--saved">💾 уточнение</span>
        <span v-if="task.isCustom"            class="bonus bonus--custom">👤 своя</span>
      </div>
    </div>

    <div class="task-actions" @click.stop>
      <button v-if="hasDetail"  class="icon-action"                    @click="$emit('open-detail', task)" title="Подробнее">🔍</button>
      <button                   class="icon-action"                    @click="$emit('edit', task)"        title="Редактировать">✏️</button>
      <button                   class="icon-action icon-action--danger" @click="$emit('delete', task)"
        :title="task.isCustom ? 'Удалить задачу' : 'Убрать из списка'">🗑️</button>
      <button class="task-btn" @click="complete" :disabled="justDone">
        {{ justDone ? '✓' : 'Готово' }}
      </button>
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

const justDone = ref(false)

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
.task-card {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.85rem 1rem; background: var(--bg-card);
  border: 1.5px solid var(--border); border-radius: 14px; transition: all 0.25s;
}
.task-card--clickable { cursor: pointer; }
.task-card--clickable:hover { border-color: var(--accent); transform: translateX(3px); }
.task-card--done       { opacity: 0.6; }
.task-card--productive { border-left: 4px solid var(--color-satiety); }
.task-card--fun        { border-left: 4px solid var(--color-happiness); }
.task-card--custom     { border-left: 4px solid var(--accent) !important; }

.task-icon {
  font-size: 1.4rem; min-width: 2rem; width: 2rem; height: 2rem;
  text-align: center; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.task-icon-img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
[data-theme="dark"] .task-icon--flag { filter: brightness(1.9) saturate(0.9); }

.task-body { flex: 1; min-width: 0; }
.task-title { font-size: 0.92rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-bonuses { display: flex; gap: 0.35rem; margin-top: 3px; flex-wrap: wrap; }

.bonus { font-size: 0.72rem; padding: 1px 6px; border-radius: 999px; font-weight: 600; white-space: nowrap; }
.bonus--satiety   { background: rgba(34,197,94,0.15);  color: #4ade80; }
.bonus--happiness { background: rgba(251,146,60,0.15); color: #fb923c; }
.bonus--saved     { background: rgba(99,102,241,0.15); color: #818cf8; }
.bonus--custom    { background: rgba(99,102,241,0.1);  color: #a5b4fc; }

.task-actions { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }

.icon-action {
  background: var(--bg-option); border: 1.5px solid var(--border);
  border-radius: 7px; padding: 0.25rem 0.4rem; font-size: 0.82rem;
  cursor: pointer; transition: all 0.2s; line-height: 1;
}
.icon-action:hover { background: var(--bg-hover); border-color: var(--accent); }
.icon-action--danger:hover { border-color: #ef4444; }

.task-btn {
  background: var(--accent); color: #fff; border: none;
  border-radius: 9px; padding: 0.4rem 0.8rem; font-size: 0.82rem;
  font-weight: 600; cursor: pointer; transition: all 0.2s;
  min-width: 65px; text-align: center;
}
.task-btn:hover:not(:disabled) { filter: brightness(1.1); }
.task-btn:disabled { background: var(--color-satiety); cursor: default; }
</style>
