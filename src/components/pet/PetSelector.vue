<template>
  <div class="selector-wrap">
    <h3 class="selector-title">Выбери питомца</h3>
    <div class="pet-options">
      <button
        v-for="opt in options"
        :key="opt.type"
        class="pet-option"
        :class="{ 'pet-option--active': selected === opt.type }"
        @click="selected = opt.type"
      >
        <span class="opt-emoji">{{ opt.emoji }}</span>
        <span class="opt-label">{{ opt.label }}</span>
      </button>
    </div>

    <div class="name-row">
      <label class="name-label">Имя питомца</label>
      <input
        v-model="petName"
        class="name-input"
        maxlength="20"
        :placeholder="defaultName"
      />
    </div>

    <div class="selector-actions">
      <button class="btn btn--primary" @click="confirm">Завести питомца!</button>
      <button v-if="canCancel" class="btn btn--ghost" @click="$emit('cancel')">Отмена</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PetType } from '../../types/pet.types'
import { PET_NAMES } from '../../types/pet.types'

const emit = defineEmits<{
  (e: 'confirm', type: PetType, name: string): void
  (e: 'cancel'): void
}>()

defineProps<{ canCancel?: boolean }>()

const options = [
  { type: 'cat'    as PetType, emoji: '😸', label: 'Кот' },
  { type: 'dog'    as PetType, emoji: '🐶', label: 'Пёс' },
  { type: 'dragon' as PetType, emoji: '🐲', label: 'Дракон' },
]

const selected = ref<PetType>('cat')
const petName = ref('')

const defaultName = computed(() => PET_NAMES[selected.value])

function confirm() {
  emit('confirm', selected.value, petName.value.trim() || defaultName.value)
}
</script>

<style scoped>
.selector-wrap {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.selector-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.pet-options {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.pet-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--bg-option);
  border: 2px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  max-width: 100px;
}

.pet-option:hover { border-color: var(--color-satiety); }
.pet-option--active {
  border-color: var(--accent);
  background: var(--bg-option-active);
}

.opt-emoji { font-size: 2rem; }
.opt-label { font-size: 0.8rem; color: var(--text-secondary); }

.name-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.name-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.name-input {
  background: var(--bg-input);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 0.6rem 0.9rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.name-input:focus { border-color: var(--accent); }

.selector-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.btn--primary {
  background: var(--accent);
  color: #fff;
}
.btn--primary:hover { filter: brightness(1.1); }
.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1.5px solid var(--border);
}
.btn--ghost:hover { background: var(--bg-hover); }
</style>
