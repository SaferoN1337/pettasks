<template>
  <div class="pet-display" :class="`pet-display--${displayEmotion}`">

    <div class="pet-avatar-wrap">
      <div
        class="pet-avatar"
        :class="{
          'pet-avatar--thriving': displayEmotion === 'thriving',
          'pet-avatar--happy':    displayEmotion === 'happy',
          'pet-avatar--sick':     displayEmotion === 'sick',
          'pet-avatar--petting':  isPetting,
        }"
      >
        <span class="pet-emoji">{{ currentEmoji }}</span>
      </div>

      <TransitionGroup name="heart" tag="div" class="hearts-container">
        <span
          v-for="h in activeHearts"
          :key="h.id"
          class="heart"
          :style="{ '--dx': h.dx + 'px', '--dy': h.dy + 'px', '--rot': h.rot + 'deg' }"
        >{{ h.emoji }}</span>
      </TransitionGroup>
    </div>

    <button
      class="pet-btn"
      :class="{ 'pet-btn--cooldown': onCooldown }"
      :disabled="onCooldown"
      @click="handlePet"
      :title="onCooldown ? 'Подождите немного...' : 'Погладить питомца'"
    >
      <span>{{ onCooldown ? '💤' : '🤗' }}</span>
      <span>Погладить</span>
    </button>

    <div class="pet-info">
      <div class="pet-name-wrap" v-if="!editing">
        <span class="pet-name">{{ pet.name }}</span>
        <button class="pet-rename-btn" @click="startEdit" title="Переименовать">✏️</button>
      </div>
      <div class="pet-name-wrap" v-else>
        <input
          ref="nameInput"
          v-model="nameValue"
          class="pet-name-input"
          @keydown.enter="saveName"
          @keydown.esc="cancelEdit"
          maxlength="20"
          placeholder="Имя питомца"
        />
        <button class="pet-rename-btn" @click="saveName">✓</button>
      </div>

      <div class="pet-meta">
        <span class="pet-type-badge">{{ typeLabel }}</span>
        <span class="pet-age">{{ daysAlive }}д жизни</span>
      </div>

      <div class="pet-status-text" :class="`status--${displayEmotion}`">
        {{ statusText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { usePetStore } from '../../stores/pet.store'
import { PET_EMOJIS } from '../../types/pet.types'
import type { PetEmotion } from '../../types/pet.types'

const petStore = usePetStore()

// Явно достаём ref/computed — обращаемся через .value в скрипте,
// в шаблоне Vue разворачивает автоматически
const pet       = petStore.pet        // Ref<Pet>
const emotion   = petStore.emotion    // ComputedRef<PetEmotion>
const daysAlive = petStore.daysAlive  // ComputedRef<number>

// ── Поглаживание ──────────────────────────────────────────────

const isPetting    = ref(false)
const onCooldown   = ref(false)
const activeHearts = ref<Array<{ id: number; dx: number; dy: number; rot: number; emoji: string }>>([])
let heartId = 0
let pettingTimer: ReturnType<typeof setTimeout> | null = null

function handlePet() {
  if (onCooldown.value) return
  onCooldown.value = true
  setTimeout(() => { onCooldown.value = false }, 5000)

  petStore.petThePet()

  isPetting.value = true
  if (pettingTimer) clearTimeout(pettingTimer)
  pettingTimer = setTimeout(() => { isPetting.value = false }, 5000)

  spawnHearts()
}

const HEART_EMOJIS = ['❤️', '💖', '💕', '💗', '💓', '💝']

function spawnHearts() {
  for (let wave = 0; wave < 3; wave++) {
    setTimeout(() => {
      const count = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < count; i++) {
        const id    = heartId++
        const dx    = (Math.random() - 0.5) * 80
        const dy    = -(30 + Math.random() * 50)
        const rot   = (Math.random() - 0.5) * 40
        const emoji = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)]
        activeHearts.value.push({ id, dx, dy, rot, emoji })
        setTimeout(() => {
          activeHearts.value = activeHearts.value.filter(h => h.id !== id)
        }, 1200)
      }
    }, wave * 1500)
  }
}

// ── Эмоция и эмодзи ──────────────────────────────────────────

// Во время поглаживания всегда показываем 'thriving'
const displayEmotion = computed<PetEmotion>(() =>
  isPetting.value ? 'thriving' : emotion.value
)

const currentEmoji = computed<string>(() =>
  PET_EMOJIS[pet.value.type][displayEmotion.value]
)

// ── Статусный текст ───────────────────────────────────────────

const statusText = computed<string>(() => {
  if (isPetting.value) return '😍 Кайф! Обожаю поглаживания!'
  const s = pet.value.satiety
  const h = pet.value.happiness
  switch (displayEmotion.value) {
    case 'thriving':  return '🌟 Чувствую себя превосходно!'
    case 'happy':     return `✨ Счастлив${s < 50 ? ', но немного голодноват' : ''}!`
    case 'full':      return `🍖 Сыт${h < 50 ? ', но немного скучновато' : ''}.`
    case 'content':   return '😊 Всё в порядке, живём!'
    case 'hungry':    return '🍽️ Неплохо настроен, но хочу есть!'
    case 'bored':     return '😒 Сыт, но скучаю... развлеки меня!'
    case 'sad':       return '😢 Грустит, нужна и еда, и веселье...'
    case 'exhausted': return '⚠️ Плохо себя чувствую, срочно помоги!'
    case 'sick':      return '🚨 Заболел! Срочно выполни задачу!'
    default:          return '😊 Всё в порядке!'
  }
})

const typeLabel = computed<string>(() => {
  const labels: Record<string, string> = {
    cat:    '🐈 Кот',
    dog:    '🐕 Пёс',
    dragon: '🐉 Дракон',
  }
  return labels[pet.value.type] ?? pet.value.type
})

// ── Редактирование имени ──────────────────────────────────────

const editing   = ref(false)
const nameValue = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

async function startEdit() {
  nameValue.value = pet.value.name
  editing.value   = true
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

function saveName()   { petStore.renamePet(nameValue.value); editing.value = false }
function cancelEdit() { editing.value = false }
</script>

<style scoped>
.pet-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem 0.75rem;
}

.pet-avatar-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pet-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--bg-avatar);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--border);
  transition: border-color 0.3s, transform 0.3s;
  position: relative;
  z-index: 1;
}

.pet-avatar--thriving {
  border-color: var(--color-happiness);
  animation: bob 1.5s ease-in-out infinite;
}
.pet-avatar--happy {
  border-color: var(--color-happiness);
  animation: bob 2s ease-in-out infinite;
}
.pet-avatar--sick {
  border-color: #ef4444;
  animation: shake 0.5s ease-in-out infinite;
  filter: grayscale(0.5);
}
.pet-avatar--petting {
  border-color: #f472b6 !important;
  box-shadow: 0 0 24px rgba(244, 114, 182, 0.5);
  animation: pulse-pet 0.6s ease-in-out infinite !important;
}

.pet-emoji {
  font-size: 3rem;
  line-height: 1;
  user-select: none;
}

.hearts-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.heart {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 1.3rem;
  transform: translate(-50%, -50%);
  animation: float-heart 1.2s ease-out forwards;
}

@keyframes float-heart {
  0%   { opacity: 1; transform: translate(calc(-50% + 0px), -50%) scale(0.5) rotate(0deg); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.2) rotate(var(--rot)); }
}

.heart-enter-active { transition: none; }
.heart-leave-active { transition: none; }

.pet-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 1rem;
  background: rgba(244, 114, 182, 0.12);
  border: 1.5px solid #f472b6;
  border-radius: 999px;
  color: #f472b6;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.pet-btn:hover:not(:disabled) {
  background: rgba(244, 114, 182, 0.22);
  transform: scale(1.05);
}
.pet-btn--cooldown {
  opacity: 0.5;
  border-color: var(--border);
  color: var(--text-muted);
  background: var(--bg-option);
  cursor: not-allowed;
}
.pet-btn-hint { font-size: 0.75rem; opacity: 0.8; }

.pet-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.pet-name-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.pet-name { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }

.pet-name-input {
  font-size: 1.2rem;
  font-weight: 700;
  background: var(--bg-input);
  border: 2px solid var(--color-satiety);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 2px 8px;
  width: 150px;
  text-align: center;
  outline: none;
}

.pet-rename-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s;
  line-height: 1;
}
.pet-rename-btn:hover { background: var(--bg-hover); }

.pet-meta {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.pet-type-badge {
  background: var(--bg-badge);
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.pet-age { font-size: 0.8rem; color: var(--text-muted); }

.pet-status-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
  min-height: 1.2em;
  transition: color 0.3s;
}

.status--sick      { color: #ef4444; font-weight: 600; }
.status--exhausted { color: #f97316; font-weight: 600; }
.status--sad       { color: #94a3b8; }
.status--thriving  { color: var(--color-happiness); font-weight: 600; }

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(-3px); }
  75%       { transform: translateX(3px); }
}
@keyframes pulse-pet {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.08); }
}
</style>
