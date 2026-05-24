<template>
  <div class="task-list">
    <div class="tl-header">
      <h2 class="tl-title">Задачи</h2>
      <div class="tl-right">
        <div class="tl-filters">
          <button
            v-for="f in filters"
            :key="f.value"
            class="filter-btn"
            :class="{ 'filter-btn--active': currentFilter === f.value }"
            @click="tasksStore.setFilter(f.value)"
          >{{ f.label }}</button>
        </div>
        <div class="tl-actions">
          <button class="btn-add-task" @click="openEditor(null)">➕ Своя задача</button>
          <button
            v-if="hiddenCount > 0"
            class="btn-restore"
            @click="restoreOpen = true"
          >🔄 Удалённые ({{ hiddenCount }})</button>
        </div>
      </div>
    </div>

    <Transition name="bonus">
      <div v-if="bonusMessage" class="bonus-toast">{{ bonusMessage }}</div>
    </Transition>

    <div v-if="tasks.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-text">Нет задач в этой категории</div>
      <button v-if="hiddenCount > 0" class="btn-restore-inline" @click="restoreOpen = true">
        Восстановить удалённые задачи
      </button>
    </div>

    <div class="task-cards">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @open-detail="openDetail"
        @edit="openEditor"
        @delete="deleteTask"
      />
    </div>

    <div v-if="history.length > 0" class="history-section">
      <h3 class="history-title">📜 История (последние 5)</h3>
      <div class="history-list">
        <div v-for="(item, i) in history" :key="i" class="history-item">
          <span class="history-time">{{ formatTime(item.completedAt) }}</span>
          <span class="history-name">{{ item.taskTitle }}</span>
          <span class="history-bonuses">
            <span v-if="item.satietyBonus > 0">🍖+{{ item.satietyBonus }}</span>
            <span v-if="item.happinessBonus > 0">✨+{{ item.happinessBonus }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>

  <TaskDetailModal v-model="detailOpen" :task="selectedTask" />
  <TaskEditorModal v-model="editorOpen" :editing-task="editingTask" />
  <RestoreTasksModal v-model="restoreOpen" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTasksStore } from '../../stores/tasks.store'
import type { TaskFilter, Task } from '../../types/task.types'
import TaskCard from './TaskCard.vue'
import TaskDetailModal from './TaskDetailModal.vue'
import TaskEditorModal from './TaskEditorModal.vue'
import RestoreTasksModal from './RestoreTasksModal.vue'

const tasksStore = useTasksStore()

// Извлекаем computed/ref через .value в скрипте, Vue разворачивает в шаблоне
const tasks         = computed<Task[]>(() => tasksStore.filteredTasks.value)
const currentFilter = computed<TaskFilter>(() => tasksStore.filter.value)
const hiddenCount   = computed<number>(() => tasksStore.hiddenCount.value)
const bonusMessage  = computed<string | null>(() => tasksStore.lastBonusMessage.value)
const history       = computed(() => tasksStore.completedHistory.value)

const filters: { label: string; value: TaskFilter }[] = [
  { label: 'Все',          value: 'all' },
  { label: '💪 Полезные', value: 'productive' },
  { label: '🎉 Весёлые',  value: 'fun' },
]

const detailOpen   = ref(false)
const selectedTask = ref<Task | null>(null)
const editorOpen   = ref(false)
const editingTask  = ref<Task | null>(null)
const restoreOpen  = ref(false)

function openDetail(task: Task) { selectedTask.value = task; detailOpen.value = true }
function openEditor(task: Task | null) { editingTask.value = task; editorOpen.value = true }

function deleteTask(task: Task) {
  if (task.isCustom) {
    if (confirm(`Удалить задачу «${task.title}»? Это нельзя отменить.`)) {
      tasksStore.deleteCustomTask(task.id)
    }
  } else {
    if (confirm(`Убрать «${task.title}» из списка?\nМожно восстановить кнопкой «Удалённые».`)) {
      tasksStore.hideDefaultTask(task.id)
    }
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.task-list { display: flex; flex-direction: column; gap: 1rem; }

.tl-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
.tl-title  { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }

.tl-right   { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
.tl-filters { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.filter-btn { padding: 0.3rem 0.7rem; border: 1.5px solid var(--border); border-radius: 999px; background: transparent; color: var(--text-secondary); font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.filter-btn--active { background: var(--accent); border-color: var(--accent); color: #fff; }

.tl-actions { display: flex; gap: 0.4rem; align-items: center; }

.btn-add-task { padding: 0.35rem 0.8rem; background: rgba(99,102,241,0.12); border: 1.5px solid var(--accent); border-radius: 10px; color: var(--accent); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-add-task:hover { background: rgba(99,102,241,0.22); }

.btn-restore { padding: 0.35rem 0.8rem; background: rgba(34,197,94,0.1); border: 1.5px solid var(--color-satiety); border-radius: 10px; color: var(--color-satiety); font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-restore:hover { background: rgba(34,197,94,0.2); }

.bonus-toast { background: linear-gradient(135deg, var(--color-happiness), var(--accent)); color: #fff; padding: 0.65rem 1rem; border-radius: 12px; font-weight: 600; font-size: 0.9rem; text-align: center; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem 1rem; color: var(--text-muted); }
.empty-icon  { font-size: 2.5rem; }
.empty-text  { font-size: 0.9rem; }
.btn-restore-inline { margin-top: 0.25rem; padding: 0.4rem 1rem; background: rgba(34,197,94,0.1); border: 1.5px solid var(--color-satiety); border-radius: 10px; color: var(--color-satiety); font-size: 0.82rem; font-weight: 600; cursor: pointer; }

.task-cards { display: flex; flex-direction: column; gap: 0.5rem; }

.history-section { margin-top: 0.5rem; border-top: 1px solid var(--border); padding-top: 0.75rem; }
.history-title   { margin: 0 0 0.6rem; font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); }
.history-list    { display: flex; flex-direction: column; gap: 0.35rem; }
.history-item    { display: flex; gap: 0.6rem; align-items: center; font-size: 0.82rem; color: var(--text-muted); }
.history-time    { min-width: 42px; }
.history-name    { flex: 1; }
.history-bonuses { display: flex; gap: 4px; }

.bonus-enter-active, .bonus-leave-active { transition: all 0.35s ease; }
.bonus-enter-from, .bonus-leave-to       { opacity: 0; transform: translateY(-8px); }
</style>
