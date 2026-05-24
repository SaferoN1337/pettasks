<template>
  <div class="progress-wrap">
    <div class="progress-label">
      <span class="progress-icon">{{ icon }}</span>
      <span class="progress-name">{{ label }}</span>
      <span class="progress-value">{{ Math.round(value) }}/100</span>
    </div>
    <div class="progress-track" :title="`${label}: ${Math.round(value)}`">
      <div
        class="progress-fill"
        :style="{ width: `${value}%`, background: fillColor }"
        :class="{ 'progress-fill--low': value < 30, 'progress-fill--pulse': value < 15 }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  icon: string
  value: number          // 0-100
  color?: string         // CSS color
}>()

const fillColor = computed(() => {
  if (props.color) return props.color
  if (props.value < 20) return '#ef4444'
  if (props.value < 40) return '#f97316'
  return '#22c55e'
})
</script>

<style scoped>
.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.progress-icon { font-size: 1rem; }
.progress-name { flex: 1; font-weight: 500; }
.progress-value { font-variant-numeric: tabular-nums; font-size: 0.8rem; }

.progress-track {
  height: 12px;
  border-radius: 999px;
  background: var(--bg-track);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.progress-fill--low {
  background: #ef4444 !important;
}

.progress-fill--pulse {
  animation: pulse-bar 1.2s ease-in-out infinite;
}

@keyframes pulse-bar {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
</style>
