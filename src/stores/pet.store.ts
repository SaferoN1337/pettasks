import { ref, computed } from 'vue'
import type { Pet, PetType, PetEmotion, PetRecord } from '../types/pet.types'
import { PET_NAMES } from '../types/pet.types'

const STORAGE_KEY = 'pettasks:pet'
const RECORDS_KEY = 'pettasks:records'

const DEFAULT_PET: Pet = {
  name: 'Мурзик',
  type: 'cat',
  satiety: 80,
  happiness: 80,
  birthTimestamp: Date.now(),
  lastUpdateTimestamp: Date.now(),
  petDailyBonus: 0,
  petBonusDate: '',
}

function loadPet(): Pet {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Pet
      if (p.petDailyBonus === undefined) p.petDailyBonus = 0
      if (p.petBonusDate  === undefined) p.petBonusDate  = ''
      return p
    }
  } catch {}
  return { ...DEFAULT_PET }
}

function loadRecords(): PetRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

// ── Синглтон-состояние (создаётся один раз при импорте модуля) ──

const pet     = ref<Pet>(loadPet())
const records = ref<PetRecord[]>(loadRecords())

const emotion = computed<PetEmotion>(() => {
  const { satiety: s, happiness: h } = pet.value
  if (s === 0 || h === 0)    return 'sick'
  if (s < 15 || h < 15)     return 'exhausted'
  if (s < 30 && h < 30)     return 'sad'
  if (s < 30 && h >= 50)    return 'hungry'
  if (h < 30 && s >= 50)    return 'bored'
  if (s < 30 || h < 30)     return 'sad'
  if (s > 70 && h > 70)     return 'thriving'
  if (h > 70 && s >= 30)    return 'happy'
  if (s > 70 && h >= 30)    return 'full'
  return 'content'
})

const daysAlive = computed(() => {
  const ms = Date.now() - pet.value.birthTimestamp
  return Math.floor(ms / (1000 * 60 * 60 * 24))
})

const isSick = computed(() => pet.value.satiety === 0 || pet.value.happiness === 0)

function save() {
  pet.value.lastUpdateTimestamp = Date.now()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pet.value))
}

function addSatiety(amount: number) {
  pet.value.satiety = Math.min(100, Math.max(0, pet.value.satiety + amount))
  save()
}

function addHappiness(amount: number) {
  pet.value.happiness = Math.min(100, Math.max(0, pet.value.happiness + amount))
  save()
}

function decay(satietyDelta: number, happinessDelta: number) {
  const m = isSick.value ? 2 : 1
  pet.value.satiety   = Math.max(0, pet.value.satiety   - satietyDelta   * m)
  pet.value.happiness = Math.max(0, pet.value.happiness - happinessDelta * m)
  save()
}

/**
 * Пересчитать убывание за время пока приложение было закрыто.
 * Учитывает ночное замедление (00:00–06:59 → в 4 раза медленнее).
 */
function recalculateOfflineDecay() {
  const now     = Date.now()
  const elapsed = now - pet.value.lastUpdateTimestamp
  if (elapsed < 60_000) return

  const SATIETY_PER_MIN   = 1 / 5
  const HAPPINESS_PER_MIN = 1 / 10
  const NIGHT_FACTOR      = 4
  const sickMult = (pet.value.satiety === 0 || pet.value.happiness === 0) ? 2 : 1

  let satietyLost   = 0
  let happinessLost = 0

  // Шагаем по часам для эффективности
  const stepMs = 60 * 60_000  // 1 час
  let cursor   = pet.value.lastUpdateTimestamp

  while (cursor < now) {
    const stepEnd   = Math.min(cursor + stepMs, now)
    const actualMin = (stepEnd - cursor) / 60_000
    const h         = new Date(cursor).getHours()
    const factor    = (h >= 0 && h < 7) ? 1 / NIGHT_FACTOR : 1

    satietyLost   += SATIETY_PER_MIN   * factor * actualMin
    happinessLost += HAPPINESS_PER_MIN * factor * actualMin
    cursor = stepEnd
  }

  pet.value.satiety   = Math.max(0, pet.value.satiety   - Math.floor(satietyLost)   * sickMult)
  pet.value.happiness = Math.max(0, pet.value.happiness - Math.floor(happinessLost) * sickMult)
  save()
}

function petThePet(): boolean {
  const today = new Date().toLocaleDateString('ru-RU')
  if (pet.value.petBonusDate !== today) {
    pet.value.petBonusDate  = today
    pet.value.petDailyBonus = 0
  }
  if (pet.value.petDailyBonus < 5) {
    pet.value.petDailyBonus++
    pet.value.happiness = Math.min(100, pet.value.happiness + 1)
    save()
    return true
  }
  save()
  return false
}

function renamePet(newName: string) {
  pet.value.name = newName.trim() || pet.value.name
  save()
}

function createNewPet(type: PetType, name?: string) {
  if (daysAlive.value > 0) {
    const record: PetRecord = {
      petName:   pet.value.name,
      petType:   pet.value.type,
      daysAlive: daysAlive.value,
      date:      new Date().toLocaleDateString('ru-RU'),
    }
    records.value.push(record)
    records.value.sort((a, b) => b.daysAlive - a.daysAlive)
    records.value = records.value.slice(0, 10)
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records.value))
  }
  pet.value = {
    name:                name || PET_NAMES[type],
    type,
    satiety:             80,
    happiness:           80,
    birthTimestamp:      Date.now(),
    lastUpdateTimestamp: Date.now(),
    petDailyBonus:       0,
    petBonusDate:        '',
  }
  save()
}

// Пересчёт при загрузке модуля
recalculateOfflineDecay()

// ── Composable (возвращает один и тот же синглтон) ──────────────

export function usePetStore() {
  return {
    pet, records, emotion, daysAlive, isSick,
    addSatiety, addHappiness, decay,
    petThePet, renamePet, createNewPet,
  }
}
