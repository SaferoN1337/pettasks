import { DOG_IMAGES }    from '../assets/pets/dogImages'
import { DRAGON_IMAGES } from '../assets/pets/dragonImages'

export type PetType = 'cat' | 'dog' | 'dragon'

export type PetEmotion =
  | 'thriving'   // сытость > 70 И счастье > 70
  | 'happy'      // счастье > 70, сытость 30-70
  | 'full'       // сытость > 70, счастье 30-70
  | 'content'    // оба 30-70
  | 'hungry'     // сытость < 30, счастье > 50
  | 'bored'      // счастье < 30, сытость > 50
  | 'sad'        // оба < 30
  | 'exhausted'  // сытость < 15 ИЛИ счастье < 15
  | 'sick'       // любая шкала = 0

export interface Pet {
  name: string
  type: PetType
  satiety: number
  happiness: number
  birthTimestamp: number
  lastUpdateTimestamp: number
  petDailyBonus: number
  petBonusDate: string
}

export interface PetRecord {
  petName: string
  petType: PetType
  daysAlive: number
  date: string
}

export const PET_EMOJIS: Record<PetType, Record<PetEmotion, string>> = {
  cat: {
    thriving:  '😸',
    happy:     '😺',
    full:      '🐱',
    content:   '🐱',
    hungry:    '🙀',
    bored:     '😼',
    sad:       '😿',
    exhausted: '😾',
    sick:      '🙀',
  },

  dog: {
    thriving:  DOG_IMAGES.happy,
    happy:     DOG_IMAGES.glad,
    full:      DOG_IMAGES.neutral,
    content:   DOG_IMAGES.neutral,
    hungry:    DOG_IMAGES.hungry,
    bored:     DOG_IMAGES.hungry,
    sad:       DOG_IMAGES.sad,
    exhausted: DOG_IMAGES.exhausted,
    sick:      DOG_IMAGES.exhausted,
  },

  dragon: {
    thriving:  DRAGON_IMAGES.happy,     // сердечки в глазах
    happy:     DRAGON_IMAGES.feelgood,  // знак победы
    full:      DRAGON_IMAGES.neutral,   // руки в боки, доволен
    content:   DRAGON_IMAGES.neutral,   // спокойный
    hungry:    DRAGON_IMAGES.boring,    // зевает от голода
    bored:     DRAGON_IMAGES.boring,    // зевает от скуки
    sad:       DRAGON_IMAGES.sad,       // плачет
    exhausted: DRAGON_IMAGES.angry,     // злой, измотан
    sick:      DRAGON_IMAGES.angry,     // злой, болен
  },
}

export const PET_NAMES: Record<PetType, string> = {
  cat:    'Мурзик',
  dog:    'Шарик',
  dragon: 'Дракоша',
}
