<template>
  <Modal
    v-model="isOpen"
    :title="editingTask ? (editingTask.isCustom ? '✏️ Редактировать задачу' : '✏️ Настроить стандартную задачу') : '➕ Новая задача'"
    :closable="true"
  >
    <div class="editor">

      <!-- Иконка -->
      <div class="field">
        <label class="field-label">Иконка</label>
        <div class="icon-row">
          <div class="icon-preview" :style="form.iconBg ? `background-image:url(${form.iconBg});background-size:cover;background-position:center` : ''">
            <span v-if="!form.iconBg">{{ form.icon }}</span>
          </div>
          <div class="emoji-picker">
            <button v-for="e in emojiPresets" :key="e" class="emoji-btn"
              :class="{ 'emoji-btn--active': form.icon === e && !form.iconBg }"
              @click="pickEmoji(e)">{{ e }}</button>
          </div>
        </div>
        <div class="upload-row">
          <label class="upload-label">
            📎 Загрузить изображение
            <input type="file" accept="image/*" class="file-input" @change="handleImageUpload" />
          </label>
          <button v-if="form.iconBg" class="btn-remove-img" @click="form.iconBg = ''">✕ Убрать</button>
        </div>
      </div>

      <!-- Название -->
      <div class="field">
        <label class="field-label">Название задачи *</label>
        <input v-model="form.title" class="text-input" placeholder="Например: Сделать 10 приседаний" maxlength="60" />
        <span class="field-hint">{{ form.title.length }}/60</span>
      </div>

      <!-- Описание -->
      <div class="field">
        <label class="field-label">Описание <span class="optional">(необязательно)</span></label>
        <textarea v-model="form.description" class="text-input textarea"
          placeholder="Что нужно сделать? Детали, подсказки..." maxlength="300" rows="3" />
        <span class="field-hint">{{ form.description.length }}/300</span>
      </div>

      <!-- Категория (только для своих задач) -->
      <div class="field" v-if="!editingTask || editingTask.isCustom">
        <label class="field-label">Категория</label>
        <div class="category-row">
          <button class="cat-btn" :class="{ 'cat-btn--active cat-btn--productive': form.category === 'productive' }" @click="form.category = 'productive'">💪 Полезная</button>
          <button class="cat-btn" :class="{ 'cat-btn--active cat-btn--fun': form.category === 'fun' }" @click="form.category = 'fun'">🎉 Весёлая</button>
        </div>
      </div>

      <!-- Ползунок сытости -->
      <div class="field">
        <label class="field-label">
          🍖 Бонус к сытости
          <strong class="bonus-val bonus-val--satiety">+{{ form.satietyBonus }}</strong>
        </label>
        <div class="slider-wrap">
          <input type="range" v-model.number="form.satietyBonus" min="0" max="20" step="1" class="slider" :style="satietyStyle" />
        </div>
        <div class="slider-marks"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span></div>
      </div>

      <!-- Ползунок счастья -->
      <div class="field">
        <label class="field-label">
          ✨ Бонус к счастью
          <strong class="bonus-val bonus-val--happiness">+{{ form.happinessBonus }}</strong>
        </label>
        <div class="slider-wrap">
          <input type="range" v-model.number="form.happinessBonus" min="0" max="20" step="1" class="slider" :style="happinessStyle" />
        </div>
        <div class="slider-marks"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span></div>
      </div>

      <div v-if="error" class="error-msg">⚠️ {{ error }}</div>

      <div class="editor-actions">
        <button class="btn btn--save" @click="save">
          {{ editingTask ? '💾 Сохранить' : '➕ Добавить задачу' }}
        </button>
        <!-- Сброс к умолчаниям для стандартных задач -->
        <button v-if="editingTask && !editingTask.isCustom" class="btn btn--reset" @click="resetToDefault">
          ↺ Сброс
        </button>
        <button class="btn btn--cancel" @click="isOpen = false">Отмена</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from 'vue'
import Modal from '../common/Modal.vue'
import type { Task, TaskCategory } from '../../types/task.types'
import { useTasksStore } from '../../stores/tasks.store'

const props = defineProps<{ modelValue: boolean; editingTask?: Task | null }>()
const emit  = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const tasksStore = useTasksStore()
const isOpen = ref(props.modelValue)
const error  = ref('')

watch(() => props.modelValue, v => { isOpen.value = v })
watch(isOpen, v => emit('update:modelValue', v))

interface FormState {
  icon: string; iconBg: string; title: string; description: string
  category: TaskCategory; satietyBonus: number; happinessBonus: number
}

const freshForm = (): FormState => ({
  icon: '⭐', iconBg: '', title: '', description: '',
  category: 'productive', satietyBonus: 10, happinessBonus: 10,
})

const form = reactive<FormState>(freshForm())

watch(() => [props.modelValue, props.editingTask] as const, ([open, task]) => {
  if (!open) return
  error.value = ''
  if (task) {
    form.icon          = task.icon
    form.iconBg        = task.icon.startsWith('data:') ? task.icon : ''
    form.title         = task.title
    form.description   = task.description ?? ''
    form.category      = task.category
    form.satietyBonus  = task.satietyBonus
    form.happinessBonus = task.happinessBonus
  } else {
    Object.assign(form, freshForm())
  }
}, { immediate: true })

const satietyStyle = computed(() => {
  const pct = (form.satietyBonus / 20) * 100
  return { background: `linear-gradient(to right,var(--color-satiety) 0%,var(--color-satiety) ${pct}%,var(--bg-track) ${pct}%,var(--bg-track) 100%)`, accentColor: 'var(--color-satiety)' }
})
const happinessStyle = computed(() => {
  const pct = (form.happinessBonus / 20) * 100
  return { background: `linear-gradient(to right,var(--color-happiness) 0%,var(--color-happiness) ${pct}%,var(--bg-track) ${pct}%,var(--bg-track) 100%)`, accentColor: 'var(--color-happiness)' }
})

const emojiPresets = [
  '⭐','🏃','🧘','📚','💻','🎨','🎬','🍳','🌳','🏋️',
  '🎵','📝','🧹','☎️','🛁','🎮','📸','🎤','🍪','💊',
  '🚿','🥗','🧠','✍️','🌅','🤸','🎯','🏊','🛒','🌿',
]

function pickEmoji(e: string) { form.icon = e; form.iconBg = '' }

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 500 * 1024) { error.value = 'Файл слишком большой (максимум 500 КБ)'; return }
  const reader = new FileReader()
  reader.onload = e => { form.iconBg = e.target?.result as string; form.icon = '🖼️' }
  reader.readAsDataURL(file)
}

function save() {
  error.value = ''
  if (!form.title.trim()) { error.value = 'Введите название задачи'; return }
  if (form.satietyBonus === 0 && form.happinessBonus === 0) {
    error.value = 'Задача должна давать хотя бы 1 балл'; return
  }
  const iconValue = form.iconBg || form.icon
  const taskData = {
    icon: iconValue, title: form.title.trim(), description: form.description.trim(),
    category: form.category, satietyBonus: form.satietyBonus, happinessBonus: form.happinessBonus,
  }
  if (props.editingTask) {
    if (props.editingTask.isCustom) {
      tasksStore.updateCustomTask(props.editingTask.id, taskData)
    } else {
      tasksStore.updateDefaultTask(props.editingTask.id, taskData)
    }
  } else {
    tasksStore.addCustomTask(taskData)
  }
  isOpen.value = false
}

function resetToDefault() {
  if (!props.editingTask || props.editingTask.isCustom) return
  if (confirm('Сбросить изменения этой задачи к стандартным настройкам?')) {
    tasksStore.resetDefaultTask(props.editingTask.id)
    isOpen.value = false
  }
}
</script>

<style scoped>
.editor { display: flex; flex-direction: column; gap: 1rem; }
.field  { display: flex; flex-direction: column; gap: 0.4rem; }
.field-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem; }
.optional    { font-weight: 400; color: var(--text-muted); }
.field-hint  { font-size: 0.75rem; color: var(--text-muted); align-self: flex-end; }

.icon-row    { display: flex; gap: 0.75rem; align-items: flex-start; }
.icon-preview { width: 56px; height: 56px; border-radius: 14px; background: var(--bg-option); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0; overflow: hidden; }
.emoji-picker { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; }
.emoji-btn { width: 34px; height: 34px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--bg-option); font-size: 1rem; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; line-height: 1; }
.emoji-btn:hover { border-color: var(--accent); background: var(--bg-hover); }
.emoji-btn--active { border-color: var(--accent); background: var(--bg-option-active); }

.upload-row   { display: flex; align-items: center; gap: 0.6rem; }
.upload-label { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; background: var(--bg-option); border: 1.5px solid var(--border); border-radius: 10px; font-size: 0.82rem; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; font-weight: 500; }
.upload-label:hover { background: var(--bg-hover); border-color: var(--accent); }
.file-input   { display: none; }
.btn-remove-img { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.82rem; padding: 2px 6px; border-radius: 6px; }
.btn-remove-img:hover { color: #ef4444; }

.text-input { background: var(--bg-input); border: 1.5px solid var(--border); border-radius: 10px; color: var(--text-primary); padding: 0.6rem 0.9rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; font-family: inherit; width: 100%; }
.text-input:focus { border-color: var(--accent); }
.textarea { resize: vertical; min-height: 60px; }

.category-row { display: flex; gap: 0.6rem; }
.cat-btn { flex: 1; padding: 0.55rem; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-option); color: var(--text-secondary); font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.cat-btn:hover { background: var(--bg-hover); }
.cat-btn--active.cat-btn--productive { border-color: var(--color-satiety); background: rgba(34,197,94,0.12); color: var(--color-satiety); }
.cat-btn--active.cat-btn--fun { border-color: var(--color-happiness); background: rgba(251,146,60,0.12); color: var(--color-happiness); }

.bonus-val { margin-left: auto; font-size: 1rem; }
.bonus-val--satiety   { color: var(--color-satiety); }
.bonus-val--happiness { color: var(--color-happiness); }

.slider-wrap { position: relative; padding: 4px 0; }
.slider { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: 999px; outline: none; cursor: pointer; }
.slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 2.5px solid currentColor; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.25); transition: transform .15s; }
.slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
.slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 2.5px solid currentColor; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.slider-marks { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; padding: 0 2px; }

.error-msg { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: .55rem .9rem; font-size: .85rem; color: #ef4444; }

.editor-actions { display: flex; gap: 0.6rem; margin-top: 0.25rem; }
.btn { flex: 1; padding: 0.72rem; border-radius: 12px; font-weight: 700; font-size: 0.88rem; cursor: pointer; border: none; transition: all 0.2s; }
.btn--save   { background: var(--accent); color: #fff; }
.btn--save:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn--reset  { background: rgba(251,146,60,0.12); border: 1.5px solid var(--color-happiness); color: var(--color-happiness); flex: 0 0 auto; padding: 0.72rem 1rem; }
.btn--reset:hover { background: rgba(251,146,60,0.22); }
.btn--cancel { background: var(--bg-option); border: 1.5px solid var(--border); color: var(--text-secondary); }
.btn--cancel:hover { background: var(--bg-hover); }
</style>
