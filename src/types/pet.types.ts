import { DOG_IMAGES } from '../assets/pets/dogImages'

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

/**
 * Эмодзи/изображения питомцев по состояниям.
 * Кот:    стандартные кошачьи Unicode-эмодзи
 * Пёс:    пользовательские PNG-изображения (base64)
 * Дракон: тематические рептилийные эмодзи
 */
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

  // Для пса используем загруженные PNG-картинки
  dog: {
    thriving:  DOG_IMAGES.happy,     // широкая улыбка, закрытые глаза — счастлив
    happy:     DOG_IMAGES.glad,      // открытый рот, радость
    full:      DOG_IMAGES.neutral,   // нейтральная мордочка — сытый и спокойный
    content:   DOG_IMAGES.neutral,   // нейтральная мордочка — доволен
    hungry:    DOG_IMAGES.hungry,    // сморщенная мордочка — голодный
    bored:     DOG_IMAGES.hungry,    // та же мордочка — недоволен
    sad:       DOG_IMAGES.sad,       // закрытые глаза, грусть
    exhausted: DOG_IMAGES.exhausted, // хмурый взгляд — измотан
    sick:      DOG_IMAGES.exhausted, // хмурый — совсем плохо
  },

  dragon: {
    thriving:  '🐲',
    happy:     '🐉',
    full:      '🦎',
    content:   '🦎',
    hungry:    '🔥',
    bored:     '🦕',
    sad:       '🐊',
    exhausted: '🦖',
    sick:      '🐍',
  },
}

export const PET_NAMES: Record<PetType, string> = {
  cat:    'Мурзик',
  dog:    'Шарик',
  dragon: 'Дракоша',
}
