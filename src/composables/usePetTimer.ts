import { onMounted, onUnmounted } from 'vue'
import { usePetStore } from '../stores/pet.store'

/**
 * Базовые интервалы убывания (дневное время):
 *   Сытость:  -1 каждые 5 мин
 *   Счастье:  -1 каждые 10 мин
 *
 * Ночью (00:00–07:00) убывание в 4 раза медленнее:
 *   Сытость:  -1 каждые 20 мин
 *   Счастье:  -1 каждые 40 мин
 *
 * Таймер тикает раз в минуту и накапливает дробные очки —
 * это позволяет плавно переключаться между дневной и ночной скоростью.
 */

const SATIETY_DAY_RATE   = 1 / 5     // очков в минуту (1 за 5 мин)
const HAPPINESS_DAY_RATE = 1 / 10    // очков в минуту (1 за 10 мин)
const NIGHT_FACTOR       = 4         // ночью в 4 раза медленнее
const TICK_MS            = 60_000    // тик каждые 60 секунд

/** Возвращает true если сейчас ночное время (00:00–06:59) */
function isNightTime(): boolean {
  const h = new Date().getHours()
  return h >= 0 && h < 7
}

/** Текущий коэффициент убывания (1 = день, 0.25 = ночь) */
function decayFactor(): number {
  return isNightTime() ? 1 / NIGHT_FACTOR : 1
}

export function usePetTimer() {
  const petStore = usePetStore()

  // Накопители дробных очков между тиками
  let satietyAccum   = 0
  let happinessAccum = 0
  let timer: ReturnType<typeof setInterval>

  onMounted(() => {
    timer = setInterval(() => {
      const factor = decayFactor()

      // Накапливаем очки убывания за этот тик
      satietyAccum   += SATIETY_DAY_RATE   * factor
      happinessAccum += HAPPINESS_DAY_RATE * factor

      // Списываем целые очки
      const satietyLost   = Math.floor(satietyAccum)
      const happinessLost = Math.floor(happinessAccum)

      if (satietyLost > 0 || happinessLost > 0) {
        petStore.decay(satietyLost, happinessLost)
        satietyAccum   -= satietyLost
        happinessAccum -= happinessLost
      }
    }, TICK_MS)
  })

  onUnmounted(() => clearInterval(timer))
}
