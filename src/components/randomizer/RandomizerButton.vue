<template>
  <button class="rand-btn" @click="randomizerStore.open()">
    <span class="rand-icon">🎲</span>
    <span class="rand-text">Не знаю, что делать!</span>
  </button>
</template>

<script setup lang="ts">
import { useRandomizerStore } from '../../stores/randomizer.store'
const randomizerStore = useRandomizerStore()
</script>

<style scoped>
.rand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.9rem 1.5rem;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
}

.rand-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(124, 58, 237, 0.4);
  filter: brightness(1.05);
}

.rand-btn:active { transform: translateY(0); }

.rand-icon {
  font-size: 1.3rem;
  animation: spin-gentle 3s ease-in-out infinite;
}

@keyframes spin-gentle {
  0%, 100% { transform: rotate(0deg); }
  25%       { transform: rotate(-10deg); }
  75%       { transform: rotate(10deg); }
}
</style>
