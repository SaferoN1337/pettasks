/**
 * Сервис для получения случайных английских слов с переводом.
 * Используем Free Dictionary API для получения определений,
 * а MyMemory API (бесплатный, без ключа, CORS-friendly) — для перевода.
 *
 * Запасной список: топ-200 наиболее употребительных английских слов.
 */
import { cacheService } from './cache.service'

export interface WordPair {
  en: string
  ru: string
}

// ── Топ-200 самых употребляемых английских слов с переводом ──
// Источник: Oxford 3000 / наиболее частотные слова корпуса
const TOP_WORDS: WordPair[] = [
  { en: 'able',        ru: 'способный' },
  { en: 'accept',      ru: 'принимать' },
  { en: 'achieve',     ru: 'достигать' },
  { en: 'action',      ru: 'действие' },
  { en: 'actually',    ru: 'на самом деле' },
  { en: 'add',         ru: 'добавлять' },
  { en: 'address',     ru: 'адрес; обращаться' },
  { en: 'admit',       ru: 'признавать' },
  { en: 'affect',      ru: 'влиять' },
  { en: 'agree',       ru: 'соглашаться' },
  { en: 'allow',       ru: 'разрешать' },
  { en: 'already',     ru: 'уже' },
  { en: 'although',    ru: 'хотя' },
  { en: 'always',      ru: 'всегда' },
  { en: 'amount',      ru: 'количество, сумма' },
  { en: 'appear',      ru: 'появляться, казаться' },
  { en: 'apply',       ru: 'применять; подавать заявку' },
  { en: 'argue',       ru: 'спорить, утверждать' },
  { en: 'around',      ru: 'вокруг, примерно' },
  { en: 'ask',         ru: 'спрашивать, просить' },
  { en: 'available',   ru: 'доступный' },
  { en: 'avoid',       ru: 'избегать' },
  { en: 'aware',       ru: 'осознающий, в курсе' },
  { en: 'beautiful',   ru: 'красивый' },
  { en: 'because',     ru: 'потому что' },
  { en: 'become',      ru: 'становиться' },
  { en: 'begin',       ru: 'начинать' },
  { en: 'believe',     ru: 'верить, считать' },
  { en: 'between',     ru: 'между' },
  { en: 'bring',       ru: 'приносить' },
  { en: 'build',       ru: 'строить, создавать' },
  { en: 'business',    ru: 'бизнес, дело' },
  { en: 'call',        ru: 'звонить, называть' },
  { en: 'careful',     ru: 'осторожный' },
  { en: 'carry',       ru: 'нести, перевозить' },
  { en: 'certain',     ru: 'определённый, уверенный' },
  { en: 'change',      ru: 'изменять, менять' },
  { en: 'choose',      ru: 'выбирать' },
  { en: 'claim',       ru: 'утверждать, требовать' },
  { en: 'clear',       ru: 'ясный, чёткий' },
  { en: 'close',       ru: 'закрывать; близкий' },
  { en: 'common',      ru: 'общий, распространённый' },
  { en: 'compare',     ru: 'сравнивать' },
  { en: 'complete',    ru: 'завершать, полный' },
  { en: 'consider',    ru: 'рассматривать' },
  { en: 'continue',    ru: 'продолжать' },
  { en: 'control',     ru: 'контролировать' },
  { en: 'correct',     ru: 'правильный, исправлять' },
  { en: 'cover',       ru: 'покрывать, охватывать' },
  { en: 'create',      ru: 'создавать' },
  { en: 'culture',     ru: 'культура' },
  { en: 'current',     ru: 'текущий, современный' },
  { en: 'decide',      ru: 'решать' },
  { en: 'deep',        ru: 'глубокий' },
  { en: 'describe',    ru: 'описывать' },
  { en: 'develop',     ru: 'развивать' },
  { en: 'different',   ru: 'разный, другой' },
  { en: 'difficult',   ru: 'трудный' },
  { en: 'discover',    ru: 'открывать, обнаруживать' },
  { en: 'discuss',     ru: 'обсуждать' },
  { en: 'early',       ru: 'ранний, рано' },
  { en: 'economy',     ru: 'экономика' },
  { en: 'education',   ru: 'образование' },
  { en: 'effect',      ru: 'эффект, воздействие' },
  { en: 'effort',      ru: 'усилие' },
  { en: 'either',      ru: 'либо, тоже (нет)' },
  { en: 'enough',      ru: 'достаточно' },
  { en: 'environment', ru: 'окружающая среда' },
  { en: 'especially',  ru: 'особенно' },
  { en: 'even',        ru: 'даже; ровный' },
  { en: 'event',       ru: 'событие' },
  { en: 'every',       ru: 'каждый' },
  { en: 'exactly',     ru: 'именно, точно' },
  { en: 'example',     ru: 'пример' },
  { en: 'exist',       ru: 'существовать' },
  { en: 'expect',      ru: 'ожидать' },
  { en: 'experience',  ru: 'опыт; переживать' },
  { en: 'explain',     ru: 'объяснять' },
  { en: 'express',     ru: 'выражать' },
  { en: 'fact',        ru: 'факт' },
  { en: 'fail',        ru: 'терпеть неудачу' },
  { en: 'fall',        ru: 'падать; осень' },
  { en: 'family',      ru: 'семья' },
  { en: 'feeling',     ru: 'чувство, ощущение' },
  { en: 'finally',     ru: 'наконец' },
  { en: 'follow',      ru: 'следовать' },
  { en: 'force',       ru: 'сила, заставлять' },
  { en: 'forget',      ru: 'забывать' },
  { en: 'free',        ru: 'свободный, бесплатный' },
  { en: 'future',      ru: 'будущее' },
  { en: 'general',     ru: 'общий; генерал' },
  { en: 'give',        ru: 'давать' },
  { en: 'global',      ru: 'глобальный' },
  { en: 'goal',        ru: 'цель' },
  { en: 'grow',        ru: 'расти' },
  { en: 'happen',      ru: 'случаться' },
  { en: 'health',      ru: 'здоровье' },
  { en: 'heart',       ru: 'сердце' },
  { en: 'help',        ru: 'помогать, помощь' },
  { en: 'history',     ru: 'история' },
  { en: 'hope',        ru: 'надеяться, надежда' },
  { en: 'huge',        ru: 'огромный' },
  { en: 'human',       ru: 'человеческий, человек' },
  { en: 'idea',        ru: 'идея' },
  { en: 'identify',    ru: 'определять, устанавливать' },
  { en: 'imagine',     ru: 'представлять' },
  { en: 'important',   ru: 'важный' },
  { en: 'include',     ru: 'включать' },
  { en: 'increase',    ru: 'увеличивать' },
  { en: 'indeed',      ru: 'действительно' },
  { en: 'information', ru: 'информация' },
  { en: 'interest',    ru: 'интерес; проценты' },
  { en: 'involve',     ru: 'вовлекать, включать' },
  { en: 'issue',       ru: 'вопрос, выпуск, проблема' },
  { en: 'join',        ru: 'присоединяться' },
  { en: 'keep',        ru: 'хранить, продолжать' },
  { en: 'kind',        ru: 'добрый; вид, тип' },
  { en: 'large',       ru: 'большой' },
  { en: 'later',       ru: 'позже' },
  { en: 'lead',        ru: 'вести, руководить' },
  { en: 'learn',       ru: 'учиться, узнавать' },
  { en: 'leave',       ru: 'уходить, оставлять' },
  { en: 'level',       ru: 'уровень' },
  { en: 'likely',      ru: 'вероятный, вероятно' },
  { en: 'listen',      ru: 'слушать' },
  { en: 'live',        ru: 'жить; живой' },
  { en: 'long',        ru: 'длинный; долго' },
  { en: 'look',        ru: 'смотреть, искать' },
  { en: 'lose',        ru: 'терять, проигрывать' },
  { en: 'maintain',    ru: 'поддерживать' },
  { en: 'major',       ru: 'главный, основной' },
  { en: 'manage',      ru: 'управлять, справляться' },
  { en: 'matter',      ru: 'иметь значение; дело' },
  { en: 'maybe',       ru: 'может быть' },
  { en: 'mean',        ru: 'означать; средний' },
  { en: 'meet',        ru: 'встречать' },
  { en: 'mention',     ru: 'упоминать' },
  { en: 'method',      ru: 'метод' },
  { en: 'mind',        ru: 'разум; возражать' },
  { en: 'miss',        ru: 'скучать; пропускать' },
  { en: 'moment',      ru: 'момент' },
  { en: 'move',        ru: 'двигать, переезжать' },
  { en: 'natural',     ru: 'естественный' },
  { en: 'necessary',   ru: 'необходимый' },
  { en: 'need',        ru: 'нуждаться, нужда' },
  { en: 'never',       ru: 'никогда' },
  { en: 'next',        ru: 'следующий' },
  { en: 'offer',       ru: 'предлагать' },
  { en: 'often',       ru: 'часто' },
  { en: 'once',        ru: 'однажды, как только' },
  { en: 'open',        ru: 'открывать; открытый' },
  { en: 'order',       ru: 'порядок, заказывать' },
  { en: 'others',      ru: 'другие' },
  { en: 'otherwise',   ru: 'иначе' },
  { en: 'own',         ru: 'собственный; владеть' },
  { en: 'part',        ru: 'часть' },
  { en: 'particular',  ru: 'конкретный, особый' },
  { en: 'pass',        ru: 'проходить, передавать' },
  { en: 'perhaps',     ru: 'возможно' },
  { en: 'place',       ru: 'место, помещать' },
  { en: 'plan',        ru: 'план, планировать' },
  { en: 'play',        ru: 'играть, пьеса' },
  { en: 'point',       ru: 'точка, указывать' },
  { en: 'possible',    ru: 'возможный' },
  { en: 'power',       ru: 'сила, мощь, власть' },
  { en: 'prepare',     ru: 'готовить, подготавливать' },
  { en: 'present',     ru: 'настоящий; подарок; представлять' },
  { en: 'problem',     ru: 'проблема' },
  { en: 'produce',     ru: 'производить, создавать' },
  { en: 'protect',     ru: 'защищать' },
  { en: 'prove',       ru: 'доказывать' },
  { en: 'provide',     ru: 'обеспечивать, предоставлять' },
  { en: 'pull',        ru: 'тянуть' },
  { en: 'push',        ru: 'толкать' },
  { en: 'put',         ru: 'класть, помещать' },
  { en: 'quickly',     ru: 'быстро' },
  { en: 'raise',       ru: 'поднимать, растить' },
  { en: 'reach',       ru: 'достигать' },
  { en: 'realize',     ru: 'понимать, осознавать' },
  { en: 'reason',      ru: 'причина, разум' },
  { en: 'receive',     ru: 'получать' },
  { en: 'recently',    ru: 'недавно' },
  { en: 'remain',      ru: 'оставаться' },
  { en: 'remember',    ru: 'помнить' },
  { en: 'report',      ru: 'отчёт, сообщать' },
  { en: 'require',     ru: 'требовать' },
  { en: 'result',      ru: 'результат' },
  { en: 'return',      ru: 'возвращать' },
  { en: 'reveal',      ru: 'раскрывать' },
  { en: 'right',       ru: 'правильный; право; вправо' },
  { en: 'rise',        ru: 'подниматься, вставать' },
  { en: 'role',        ru: 'роль' },
  { en: 'run',         ru: 'бежать, запускать' },
  { en: 'same',        ru: 'тот же, одинаковый' },
  { en: 'sense',       ru: 'смысл, ощущение' },
  { en: 'serious',     ru: 'серьёзный' },
  { en: 'simple',      ru: 'простой' },
  { en: 'situation',   ru: 'ситуация' },
  { en: 'small',       ru: 'маленький' },
  { en: 'solve',       ru: 'решать (задачу)' },
  { en: 'someone',     ru: 'кто-то' },
  { en: 'sometimes',   ru: 'иногда' },
  { en: 'sorry',       ru: 'извините; сожалею' },
  { en: 'spend',       ru: 'тратить' },
  { en: 'start',       ru: 'начинать' },
  { en: 'stop',        ru: 'останавливать' },
  { en: 'strong',      ru: 'сильный' },
  { en: 'study',       ru: 'учиться, изучать' },
  { en: 'success',     ru: 'успех' },
  { en: 'support',     ru: 'поддерживать, поддержка' },
  { en: 'sure',        ru: 'уверенный' },
  { en: 'system',      ru: 'система' },
  { en: 'talk',        ru: 'разговаривать' },
  { en: 'technology',  ru: 'технология' },
  { en: 'tell',        ru: 'говорить, рассказывать' },
  { en: 'therefore',   ru: 'поэтому' },
  { en: 'though',      ru: 'хотя' },
  { en: 'through',     ru: 'через, сквозь' },
  { en: 'together',    ru: 'вместе' },
  { en: 'toward',      ru: 'к, по направлению к' },
  { en: 'true',        ru: 'истинный, настоящий' },
  { en: 'try',         ru: 'пробовать' },
  { en: 'turn',        ru: 'поворачивать; очередь' },
  { en: 'understand',  ru: 'понимать' },
  { en: 'until',       ru: 'до, пока не' },
  { en: 'usually',     ru: 'обычно' },
  { en: 'value',       ru: 'ценность, ценить' },
  { en: 'various',     ru: 'различный, разный' },
  { en: 'voice',       ru: 'голос' },
  { en: 'walk',        ru: 'ходить, прогулка' },
  { en: 'want',        ru: 'хотеть' },
  { en: 'watch',       ru: 'смотреть; часы' },
  { en: 'whole',       ru: 'целый, весь' },
  { en: 'within',      ru: 'внутри, в пределах' },
  { en: 'without',     ru: 'без' },
  { en: 'wonder',      ru: 'удивляться; задумываться' },
  { en: 'word',        ru: 'слово' },
  { en: 'worry',       ru: 'беспокоиться' },
  { en: 'write',       ru: 'писать' },
  { en: 'wrong',       ru: 'неправильный, ошибочный' },
  { en: 'yet',         ru: 'ещё, уже (вопрос)' },
]

/**
 * Попытаться подтянуть случайное слово из API Datamuse (CORS-friendly, без ключа).
 * Datamuse умеет возвращать частотные слова по теме.
 * Перевод — через MyMemory API (бесплатный, без ключа).
 */
async function fetchWordWithTranslation(word: string): Promise<WordPair | null> {
  try {
    const transRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ru`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!transRes.ok) return null
    const transData = await transRes.json()
    const translation: string = transData?.responseData?.translatedText
    if (!translation || translation === word || translation.toLowerCase() === 'no translation found') return null
    // Иногда MyMemory отдаёт перевод в верхнем регистре — приводим
    return { en: word, ru: translation.toLowerCase() }
  } catch {
    return null
  }
}

/**
 * Получить 5 случайных слов.
 * 1) Пробуем Datamuse → MyMemory для перевода
 * 2) Если не получилось — берём из встроенного словаря
 */
export async function getRandomWords(): Promise<WordPair[]> {
  const CACHE_KEY = 'words_pool_v2'

  // Используем кэш чтобы не долбить API каждый раз
  let pool = cacheService.get<WordPair[]>(CACHE_KEY)

  if (!pool || pool.length < 20) {
    // Пробуем расширить пул через Datamuse
    try {
      // Запрашиваем часто используемые слова
      const res = await fetch(
        'https://api.datamuse.com/words?ml=common&max=200&md=f',
        { signal: AbortSignal.timeout(5000) }
      )
      if (res.ok) {
        const data: Array<{ word: string; score?: number; tags?: string[] }> = await res.json()
        // Берём слова длиннее 3 букв, только одиночные слова
        const candidates = data
          .map(d => d.word)
          .filter(w => w.length > 3 && /^[a-z]+$/.test(w))
          .slice(0, 50)

        // Переводим первые 20 параллельно
        const pairs = await Promise.all(
          candidates.slice(0, 20).map(w => fetchWordWithTranslation(w))
        )
        const valid = pairs.filter(Boolean) as WordPair[]
        if (valid.length >= 5) {
          pool = valid
          cacheService.set(CACHE_KEY, pool)
        }
      }
    } catch {
      // Молча падаем на встроенный словарь
    }
  }

  // Основной выбор — из расширенного встроенного списка (200 слов)
  const source = (pool && pool.length >= 5) ? [...pool, ...TOP_WORDS] : TOP_WORDS
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5)
}
