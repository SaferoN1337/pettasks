import { onMounted, onUnmounted } from 'vue'
import { usePetStore } from '../stores/pet.store'

/**
 * Composable для фонового убывания шкал питомца.
 * Монтируется один раз в App.vue.
 */
export function usePetTimer() {
  const petStore = usePetStore()

  let satietyTimer: ReturnType<typeof setInterval>
  let happinessTimer: ReturnType<typeof setInterval>

  onMounted(() => {
    // Сытость: -1 каждые 5 минут
    satietyTimer = setInterval(() => {
      petStore.decay(1, 0)
    }, 5 * 60 * 1000)

    // Счастье: -1 каждые 10 минут
    happinessTimer = setInterval(() => {
      petStore.decay(0, 1)
    }, 10 * 60 * 1000)
  })

  onUnmounted(() => {
    clearInterval(satietyTimer)
    clearInterval(happinessTimer)
  })
}
