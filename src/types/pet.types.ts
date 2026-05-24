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

// Только «звериные» эмодзи — никаких человеческих смайликов
export const PET_EMOJIS: Record<PetType, Record<PetEmotion, string>> = {
  cat: {
    thriving:  '😸',  // радостный кот
    happy:     '😺',  // улыбающийся кот
    full:      '🐱',  // обычный кот
    content:   '🐱',  // обычный кот
    hungry:    '🙀',  // испуганный/голодный кот
    bored:     '😼',  // хитрый/скучающий кот
    sad:       '😿',  // плачущий кот
    exhausted: '😾',  // недовольный кот
    sick:      '🙀',  // испуганный/больной кот
  },
  dog: {
    thriving:  '🐶',  // радостный пёс
    happy:     '🐕',  // довольный пёс
    full:      '🐕',  // обычный пёс
    content:   '🐕',  // обычный пёс
    hungry:    '🐩',  // пёс с поднятой лапой
    bored:     '🐕‍🦺', // пёс в жилете (задумчивый)
    sad:       '🐾',  // следы — пёс ушёл грустить
    exhausted: '🦴',  // кость — очень хочет есть
    sick:      '🐶',  // пёс с грустными глазами
  },
  dragon: {
    thriving:  '🐲',  // дракон в полной силе
    happy:     '🐲',  // довольный дракон
    full:      '🦎',  // ящерица — спокойный
    content:   '🦎',  // ящерица — нейтральный
    hungry:    '🔥',  // огонь — дракон злится от голода
    bored:     '🦕',  // динозавр — скучает
    sad:       '🐊',  // крокодил — грустный
    exhausted: '🦖',  // тираннозавр — устал
    sick:      '🐍',  // змея — совсем плохо
  },
}

export const PET_NAMES: Record<PetType, string> = {
  cat:    'Мурзик',
  dog:    'Шарик',
  dragon: 'Дракоша',
}
