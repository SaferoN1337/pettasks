<template>
  <Modal v-model="isOpen" title="🔄 Восстановить задачи" :closable="true">
    <div class="restore-wrap">
      <p class="restore-hint">Выберите задачи, которые хотите вернуть в список:</p>

      <div v-if="hiddenList.length === 0" class="empty-hint">
        Нет скрытых задач
      </div>

      <div class="task-restore-list">
        <div
          v-for="task in hiddenList"
          :key="task.id"
          class="restore-item"
          :class="{
            'restore-item--productive': task.category === 'productive',
            'restore-item--fun': task.category === 'fun'
          }"
        >
          <span class="restore-icon">{{ isImageIcon(task.icon) ? '🖼️' : task.icon }}</span>

          <div class="restore-body">
            <div class="restore-title">{{ task.title }}</div>
            <div class="restore-bonuses">
              <span v-if="task.satietyBonus > 0"   class="bonus bonus--s">🍖+{{ task.satietyBonus }}</span>
              <span v-if="task.happinessBonus > 0" class="bonus bonus--h">✨+{{ task.happinessBonus }}</span>
            </div>
          </div>

          <div class="restore-actions">
            <button class="btn-restore-one" @click="restore(task.id)" title="Вернуть в список">↩</button>
            <button class="btn-delete-perm" @click="confirmDelete(task)" title="Удалить навсегда">🗑️</button>
          </div>
        </div>
      </div>

      <div v-if="hiddenList.length > 0" class="restore-footer">
        <button class="btn-restore-all" @click="restoreAll">
          ↩ Восстановить все ({{ hiddenList.length }})
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '../common/Modal.vue'
import type { Task } from '../../types/task.types'
import { useTasksStore } from '../../stores/tasks.store'

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const tasksStore = useTasksStore()
const isOpen     = ref(props.modelValue)

watch(() => props.modelValue, v => { isOpen.value = v })
watch(isOpen, v => emit('update:modelValue', v))

// hiddenDefaultTasks — ComputedRef<Task[]>, берём напрямую как computed
const hiddenList = computed<Task[]>(() => tasksStore.hiddenDefaultTasks.value)

function isImageIcon(icon: string): boolean {
  return icon.startsWith('data:') || icon.startsWith('http')
}

function restore(id: string) {
  tasksStore.restoreDefaultTask(id)
  if (hiddenList.value.length === 0) isOpen.value = false
}

function restoreAll() {
  tasksStore.restoreDefaultTasks()
  isOpen.value = false
}

function confirmDelete(task: Task) {
  if (confirm(`Удалить «${task.title}» навсегда?\nЗадачу нельзя будет восстановить.`)) {
    tasksStore.permanentlyDeleteTask(task.id)
    if (hiddenList.value.length === 0) isOpen.value = false
  }
}
</script>

<style scoped>
.restore-wrap { display: flex; flex-direction: column; gap: 0.75rem; }

.restore-hint { font-size: 0.88rem; color: var(--text-secondary); margin: 0; }
.empty-hint   { font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1rem 0; }

.task-restore-list { display: flex; flex-direction: column; gap: 0.45rem; }

.restore-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: var(--bg-option);
  border-radius: 12px;
  border-left: 4px solid var(--border);
}
.restore-item--productive { border-left-color: var(--color-satiety); }
.restore-item--fun        { border-left-color: var(--color-happiness); }

.restore-icon { font-size: 1.3rem; min-width: 1.8rem; text-align: center; }

.restore-body { flex: 1; min-width: 0; }
.restore-title   { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); }
.restore-bonuses { display: flex; gap: 0.4rem; margin-top: 2px; }

.bonus { font-size: 0.72rem; padding: 1px 7px; border-radius: 999px; font-weight: 600; }
.bonus--s { background: rgba(34,197,94,0.15);  color: #4ade80; }
.bonus--h { background: rgba(251,146,60,0.15); color: #fb923c; }

.restore-actions { display: flex; gap: 0.35rem; align-items: center; flex-shrink: 0; }

.btn-restore-one {
  background: rgba(34,197,94,0.1);
  border: 1.5px solid var(--color-satiety);
  border-radius: 8px;
  color: var(--color-satiety);
  font-size: 1rem;
  font-weight: 700;
  padding: 0.3rem 0.55rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-restore-one:hover { background: rgba(34,197,94,0.2); }

.btn-delete-perm {
  background: rgba(239,68,68,0.08);
  border: 1.5px solid rgba(239,68,68,0.4);
  border-radius: 8px;
  color: #ef4444;
  font-size: 0.85rem;
  padding: 0.3rem 0.45rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-delete-perm:hover { background: rgba(239,68,68,0.18); border-color: #ef4444; }

.restore-footer { border-top: 1px solid var(--border); padding-top: 0.75rem; }

.btn-restore-all {
  width: 100%;
  padding: 0.7rem;
  background: var(--color-satiety);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-restore-all:hover { filter: brightness(1.1); }
</style>
