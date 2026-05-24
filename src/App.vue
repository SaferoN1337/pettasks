<template>
  <div class="app" :class="{ 'app--dark': isDark }">
    <!-- Шапка -->
    <header class="app-header">
      <div class="header-brand">
        <span class="brand-logo">🐾</span>
        <span class="brand-name">PetTasks</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" @click="toggleTheme" :title="isDark ? 'Светлая тема' : 'Тёмная тема'">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
        <button class="icon-btn" @click="showRecords = true" title="Рекорды">🏆</button>
        <button class="icon-btn danger" @click="showReset = true" title="Новый питомец">🔄</button>
      </div>
    </header>

    <!-- Основной контент -->
    <main class="app-main">
      <!-- Левая колонка: питомец -->
      <section class="panel panel--pet">
        <PetDisplay />
        <StatusPanel />
        <div class="rand-wrap">
          <RandomizerButton />
        </div>
      </section>

      <!-- Правая колонка: задачи -->
      <section class="panel panel--tasks">
        <TaskList />
      </section>
    </main>

    <!-- Модальное окно рандомайзера -->
    <SuggestionModal />

    <!-- Модальное окно рекордов -->
    <Modal v-model="showRecords" title="🏆 Рекорды питомцев" :closable="true">
      <div v-if="petRecords.length === 0" class="empty-records">
        Пока нет рекордов. Заведи и вырасти своего первого питомца!
      </div>
      <div v-else class="records-list">
        <div v-for="(rec, i) in petRecords" :key="i" class="record-item">
          <span class="rec-rank">#{{ i + 1 }}</span>
          <span class="rec-pet">{{ rec.petType === 'cat' ? '🐈' : rec.petType === 'dog' ? '🐕' : '🐉' }} {{ rec.petName }}</span>
          <span class="rec-days">{{ rec.daysAlive }} дн.</span>
          <span class="rec-date">{{ rec.date }}</span>
        </div>
      </div>
    </Modal>

    <!-- Модальное окно сброса -->
    <Modal v-model="showReset" title="Завести нового питомца?" :closable="true">
      <p style="margin: 0 0 1rem; color: var(--text-secondary);">
        Старый питомец попадёт в таблицу рекордов. Это действие нельзя отменить.
      </p>
      <PetSelector :can-cancel="true" @confirm="handleNewPet" @cancel="showReset = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePetTimer } from './composables/usePetTimer'
import { usePetStore } from './stores/pet.store'
import type { PetType, PetRecord } from './types/pet.types'

import PetDisplay from './components/pet/PetDisplay.vue'
import StatusPanel from './components/pet/StatusPanel.vue'
import PetSelector from './components/pet/PetSelector.vue'
import TaskList from './components/tasks/TaskList.vue'
import RandomizerButton from './components/randomizer/RandomizerButton.vue'
import SuggestionModal from './components/randomizer/SuggestionModal.vue'
import Modal from './components/common/Modal.vue'

// Фоновый таймер убывания
usePetTimer()

const petStore = usePetStore()

// Разворачиваем Ref<PetRecord[]> для использования в шаблоне
const petRecords = computed<PetRecord[]>(() => petStore.records.value)

// ── Тема ──────────────────────────────────────────────────────
const isDark = ref(localStorage.getItem('pettasks:theme') !== 'light')

function applyTheme(dark: boolean) {
  // Применяем фон ко всему документу, а не только к .app
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('pettasks:theme', dark ? 'dark' : 'light')
}

// Применяем немедленно при загрузке
applyTheme(isDark.value)

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
}

const showRecords = ref(false)
const showReset   = ref(false)

function handleNewPet(type: PetType, name: string) {
  petStore.createNewPet(type, name)
  showReset.value = false
}
</script>

<style>
/* ── CSS переменные — светлая тема (дефолт) ───────────────── */
:root,
[data-theme="light"] {
  --color-satiety:   #22c55e;
  --color-happiness: #fb923c;
  --accent:          #6366f1;

  --bg-main:         #f1f5f9;
  --bg-card:         #ffffff;
  --bg-avatar:       #f8fafc;
  --bg-option:       #f1f5f9;
  --bg-option-active:#e0e7ff;
  --bg-hover:        #e2e8f0;
  --bg-input:        #f8fafc;
  --bg-badge:        #e2e8f0;
  --bg-track:        #e2e8f0;
  --border:          #cbd5e1;
  --text-primary:    #0f172a;
  --text-secondary:  #475569;
  --text-muted:      #94a3b8;

  /* Флаг GB: в светлой теме синий фон флага виден хорошо */
  --flag-filter:     none;
}

/* ── Тёмная тема — применяется через data-theme на <html> ─── */
[data-theme="dark"] {
  --bg-main:         #0f1117;
  --bg-card:         #1a1d2e;
  --bg-avatar:       #1e2130;
  --bg-option:       #1e2130;
  --bg-option-active:#2d2f5a;
  --bg-hover:        #252840;
  --bg-input:        #1e2130;
  --bg-badge:        #252840;
  --bg-track:        #252840;
  --border:          #2d3148;
  --text-primary:    #f1f5f9;
  --text-secondary:  #94a3b8;
  --text-muted:      #64748b;

  /* Флаг GB: в тёмной теме добавляем яркость чтобы буквы не сливались */
  --flag-filter:     brightness(1.8) saturate(1.2);
}

/* ── Фон всей страницы от темы на <html> ─────────────────── */
html {
  background: var(--bg-main);
  transition: background 0.3s;
}

/* ── Базовые стили ────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg-main);
  color: var(--text-primary);
  min-height: 100vh;
  transition: background 0.3s, color 0.3s;
}

/* ── Флаг GB: делаем его светлее в тёмной теме ───────────── */
/* Иконка задачи "Выучить 5 слов на английском" (task id p3) */
[data-theme="dark"] .task-icon {
  filter: var(--flag-filter, none);
}
/* Но применяем filter только к task с флагом, не ко всем эмодзи.
   Точнее: применяем brightness только к тем task-icon, которые
   содержат флаг. Проще сделать через специальный класс на карточке. */
[data-theme="dark"] .task-icon--flag {
  filter: brightness(1.9) saturate(0.9);
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Шапка ────────────────────────────────────────────────── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.5rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  transition: background 0.3s, border-color 0.3s;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo { font-size: 1.5rem; }
.brand-name {
  font-size: 1.2rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent), var(--color-happiness));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  background: var(--bg-option);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.45rem 0.7rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}
.icon-btn:hover { background: var(--bg-hover); transform: scale(1.05); }
.icon-btn.danger:hover { border-color: #ef4444; }

/* ── Основной лейаут ──────────────────────────────────────── */
.app-main {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
}

.panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  transition: background 0.3s, border-color 0.3s;
}

.panel--pet {
  display: flex;
  flex-direction: column;
  height: fit-content;
  position: sticky;
  top: 80px;
}

.rand-wrap { padding: 0 1rem 1rem; }
.panel--tasks { padding: 1.25rem; }

/* ── Рекорды ──────────────────────────────────────────────── */
.empty-records {
  text-align: center;
  color: var(--text-muted);
  padding: 1rem 0;
  font-size: 0.9rem;
}

.records-list { display: flex; flex-direction: column; gap: 0.5rem; }

.record-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--bg-option);
  border-radius: 10px;
  font-size: 0.88rem;
}

.rec-rank { color: var(--text-muted); min-width: 28px; }
.rec-pet { flex: 1; font-weight: 600; color: var(--text-primary); }
.rec-days { font-weight: 700; color: var(--accent); }
.rec-date { color: var(--text-muted); font-size: 0.78rem; }

/* ── Адаптив ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  .app-main {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }
  .panel--pet { position: static; }
}

@media (max-width: 480px) {
  .app-header { padding: 0.75rem 1rem; }
  .brand-name { font-size: 1rem; }
}
</style>
