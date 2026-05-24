<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-box" role="dialog" :aria-label="title">
          <div class="modal-header" v-if="title || closable">
            <h2 v-if="title" class="modal-title">{{ title }}</h2>
            <button v-if="closable" class="modal-close" @click="$emit('update:modelValue', false)">✕</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; title?: string; closable?: boolean }>()
defineEmits<{ (e: 'update:modelValue', val: boolean): void }>()
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  max-width: 480px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  /* Ограничение высоты + скролл внутри */
  max-height: min(700px, 90vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.75rem 2rem 1rem;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  flex: 1;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
  flex-shrink: 0;
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }

.modal-body {
  color: var(--text-secondary);
  padding: 0 2rem 1.75rem;
  overflow-y: auto;
  /* Кастомный скролл */
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.modal-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-track { background: transparent; }
.modal-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .modal-box, .modal-leave-active .modal-box {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box  { transform: scale(0.9) translateY(20px); }
.modal-leave-to   .modal-box  { transform: scale(0.95); }
</style>
