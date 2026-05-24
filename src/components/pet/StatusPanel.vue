<template>
  <div class="status-panel">
    <ProgressBar label="Сытость" icon="🍖" :value="satiety" color="var(--color-satiety)" />
    <ProgressBar label="Счастье" icon="✨" :value="happiness" color="var(--color-happiness)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePetStore } from '../../stores/pet.store'
import ProgressBar from '../common/ProgressBar.vue'

const { pet } = usePetStore()

const satiety   = computed(() => pet.value.satiety)
const happiness = computed(() => pet.value.happiness)
</script>

<style scoped>
.status-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
}
</style>
