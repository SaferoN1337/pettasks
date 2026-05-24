/**
 * Сервис фильмов через OMDB API + перевод через MyMemory.
 * Поддерживает исключение просмотренных/пропущенных фильмов.
 */
import { cacheService } from './cache.service'

const OMDB_KEY  = 'd1b7d9f7'
const OMDB_BASE = 'https://www.omdbapi.com'

export interface MovieInfo {
  title: string
  titleRaw: string
  overview: string
  overviewRaw: string
  posterUrl: string | null
  rating: number
  year: string
  translated: boolean
}

interface RawMovie {
  titleRaw: string
  overviewRaw: string
  posterUrl: string | null
  rating: number
  year: string
}

const SEARCH_TERMS = [
  'avengers', 'batman', 'inception', 'interstellar', 'matrix',
  'godfather', 'titanic', 'avatar', 'joker', 'dune',
  'spider', 'iron man', 'dark knight', 'forrest gump', 'shawshank',
  'pulp fiction', 'fight club', 'gladiator', 'braveheart', 'oppenheimer',
]

async function translateText(text: string): Promise<string> {
  if (!text.trim() || text.length < 3) return text
  const chunk = text.substring(0, 450)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|ru`
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) })
    if (!res.ok) return text
    const data = await res.json()
    const translated: string = data?.responseData?.translatedText
    // MyMemory иногда возвращает текст в верхнем регистре или не переводит
    if (!translated || translated === text.toUpperCase() || translated === text) return text
    return translated
  } catch {
    return text
  }
}

async function fetchMoviePool(): Promise<RawMovie[]> {
  const results: RawMovie[] = []
  const seen = new Set<string>()

  const promises = SEARCH_TERMS.map(async (term) => {
    try {
      const url = `${OMDB_BASE}/?s=${encodeURIComponent(term)}&type=movie&apikey=${OMDB_KEY}`
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) return []
      const data = await res.json()
      if (data.Response !== 'True' || !Array.isArray(data.Search)) return []
      return data.Search as Array<{ imdbID: string; Title: string; Year: string; Poster: string }>
    } catch { return [] }
  })

  const all = (await Promise.all(promises)).flat()
  const candidates = all.filter(m => {
    if (seen.has(m.imdbID)) return false
    seen.add(m.imdbID)
    return m.Poster && m.Poster !== 'N/A'
  })

  const detailPromises = candidates.slice(0, 80).map(async (m) => {
    try {
      const url = `${OMDB_BASE}/?i=${m.imdbID}&apikey=${OMDB_KEY}`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) return null
      const d = await res.json()
      if (d.Response !== 'True') return null
      const rating = parseFloat(d.imdbRating) || 0
      if (rating < 6.5) return null
      return {
        titleRaw:    d.Title ?? m.Title,
        overviewRaw: d.Plot && d.Plot !== 'N/A' ? d.Plot : '',
        posterUrl:   d.Poster && d.Poster !== 'N/A' ? d.Poster : null,
        rating,
        year:        d.Year ?? m.Year,
      } as RawMovie
    } catch { return null }
  })

  const details = await Promise.all(detailPromises)
  details.forEach(d => { if (d) results.push(d) })
  return results
}

/**
 * Получить случайный фильм, исключая уже виденные/пропущенные.
 * @param excludeTitles — массив названий (titleRaw) для исключения
 */
export async function getRandomMovie(excludeTitles: string[] = []): Promise<MovieInfo | null> {
  const POOL_CACHE = 'omdb_movie_pool_v3'

  try {
    let pool = cacheService.get<RawMovie[]>(POOL_CACHE)
    if (!pool || pool.length === 0) {
      pool = await fetchMoviePool()
      if (pool.length > 0) cacheService.set(POOL_CACHE, pool)
    }

    if (!pool || pool.length === 0) return getFallbackMovie(excludeTitles)

    // Исключаем просмотренные и пропущенные
    const excludeSet = new Set(excludeTitles.map(t => t.toLowerCase()))
    const available  = pool.filter(m => !excludeSet.has(m.titleRaw.toLowerCase()))
    const source     = available.length > 0 ? available : pool  // если всё исключено — берём из полного списка

    const raw = source[Math.floor(Math.random() * source.length)]

    // Переводим параллельно
    let title    = raw.titleRaw
    let overview = raw.overviewRaw || 'Описание недоступно'
    let translated = false

    try {
      const [tTitle, tOver] = await Promise.all([
        translateText(raw.titleRaw),
        raw.overviewRaw ? translateText(raw.overviewRaw) : Promise.resolve(''),
      ])
      if (tTitle !== raw.titleRaw)    { title    = tTitle;   translated = true }
      if (tOver  !== raw.overviewRaw) { overview = tOver || overview; translated = true }
    } catch { /* используем оригинал */ }

    return { title, titleRaw: raw.titleRaw, overview, overviewRaw: raw.overviewRaw, posterUrl: raw.posterUrl, rating: raw.rating, year: raw.year, translated }
  } catch (e) {
    console.warn('OMDB API недоступен:', e)
    return getFallbackMovie(excludeTitles)
  }
}

function getFallbackMovie(exclude: string[] = []): MovieInfo {
  const fallback: MovieInfo[] = [
    { title: 'Интерстеллар',              titleRaw: 'Interstellar',             overview: 'Группа астронавтов отправляется сквозь червоточину в поисках новой планеты для человечества.',        overviewRaw: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', posterUrl: null, rating: 8.6, year: '2014', translated: true },
    { title: 'Начало',                    titleRaw: 'Inception',                overview: 'Вор, умеющий проникать в сны, получает задание внедрить идею в разум жертвы.',                        overviewRaw: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', posterUrl: null, rating: 8.8, year: '2010', translated: true },
    { title: 'Зелёная миля',              titleRaw: 'The Green Mile',           overview: 'Охранник камеры смертников становится свидетелем сверхъестественных способностей осуждённого.',       overviewRaw: 'The lives of guards on Death Row are affected by one of their charges: a black man accused of child murder.', posterUrl: null, rating: 8.6, year: '1999', translated: true },
    { title: 'Побег из Шоушенка',         titleRaw: 'The Shawshank Redemption', overview: 'Несправедливо осуждённый банкир находит дружбу и надежду в стенах тюрьмы.',                          overviewRaw: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', posterUrl: null, rating: 9.3, year: '1994', translated: true },
    { title: 'Крёстный отец',             titleRaw: 'The Godfather',            overview: 'Патриарх мафиозной династии передаёт власть своему нежелающему преемнику.',                           overviewRaw: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', posterUrl: null, rating: 9.2, year: '1972', translated: true },
    { title: 'Тёмный рыцарь',             titleRaw: 'The Dark Knight',          overview: 'Бэтмен противостоит Джокеру — анархисту, погружающему Готэм в хаос.',                                 overviewRaw: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.', posterUrl: null, rating: 9.0, year: '2008', translated: true },
    { title: 'Список Шиндлера',           titleRaw: "Schindler's List",         overview: 'Немецкий предприниматель спасает более тысячи польских евреев во время Холокоста.',                   overviewRaw: 'In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.', posterUrl: null, rating: 9.0, year: '1993', translated: true },
    { title: 'Форрест Гамп',              titleRaw: 'Forrest Gump',             overview: 'Через жизнь простодушного человека из Алабамы проходит вся история Америки XX века.',                 overviewRaw: 'The presidencies of Kennedy and Johnson, Vietnam, Watergate and other events unfold through the perspective of an Alabama man.', posterUrl: null, rating: 8.8, year: '1994', translated: true },
    { title: 'Матрица',                   titleRaw: 'The Matrix',               overview: 'Хакер узнаёт, что реальность вокруг него — компьютерная симуляция.',                                  overviewRaw: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', posterUrl: null, rating: 8.7, year: '1999', translated: true },
    { title: 'Бойцовский клуб',           titleRaw: 'Fight Club',               overview: 'Офисный работник и харизматичный мыловар создают подпольный бойцовский клуб.',                        overviewRaw: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into something much more.', posterUrl: null, rating: 8.8, year: '1999', translated: true },
    { title: 'Гладиатор',                 titleRaw: 'Gladiator',                overview: 'Римский генерал становится рабом-гладиатором и мстит за смерть своей семьи.',                         overviewRaw: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.', posterUrl: null, rating: 8.5, year: '2000', translated: true },
    { title: 'Джокер',                    titleRaw: 'Joker',                    overview: 'История превращения неудавшегося комика в культового суперзлодея.',                                    overviewRaw: 'A mentally troubled stand-up comedian embarks on a downward spiral that leads to the creation of an iconic villain.', posterUrl: null, rating: 8.4, year: '2019', translated: true },
    { title: 'Дюна',                      titleRaw: 'Dune',                     overview: 'Молодой аристократ отправляется на опасную пустынную планету с самым ценным ресурсом вселенной.',      overviewRaw: 'Feature adaptation of Frank Herbert\'s science fiction novel about the son of a noble family entrusted with the protection of Arrakis.', posterUrl: null, rating: 8.0, year: '2021', translated: true },
    { title: 'Оппенгеймер',               titleRaw: 'Oppenheimer',              overview: 'История создателя атомной бомбы — человека, изменившего мир навсегда.',                               overviewRaw: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', posterUrl: null, rating: 8.3, year: '2023', translated: true },
    { title: 'Волк с Уолл-стрит',         titleRaw: 'The Wolf of Wall Street',  overview: 'Биография брокера Джордана Белфорта — взлёт, жадность и падение.',                                   overviewRaw: 'Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker living the high life to his fall involving crime, corruption and the federal government.', posterUrl: null, rating: 8.2, year: '2013', translated: true },
    { title: 'Титаник',                   titleRaw: 'Titanic',                  overview: 'История любви на борту обречённого трансатлантического лайнера.',                                      overviewRaw: 'A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.', posterUrl: null, rating: 7.9, year: '1997', translated: true },
    { title: 'Аватар',                    titleRaw: 'Avatar',                   overview: 'Парализованный морпех оказывается на планете Пандора и примыкает к местным жителям.',                 overviewRaw: 'A paraplegic marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.', posterUrl: null, rating: 7.9, year: '2009', translated: true },
    { title: 'Мстители: Финал',           titleRaw: 'Avengers: Endgame',        overview: 'Оставшиеся герои объединяются для финальной битвы с Таносом, чтобы вернуть половину вселенной.',       overviewRaw: 'After the devastating events of Infinity War, the universe is in ruins. The Avengers assemble once more to reverse Thanos\'s actions.', posterUrl: null, rating: 8.4, year: '2019', translated: true },
    { title: 'Пираты Карибского моря',    titleRaw: 'Pirates of the Caribbean', overview: 'Харизматичный пират Джек Воробей отправляется в приключения за сокровищами.',                        overviewRaw: 'Blacksmith Will Turner teams up with eccentric pirate Jack Sparrow to save his love, the governor\'s daughter, from Jack\'s former pirate allies.', posterUrl: null, rating: 8.1, year: '2003', translated: true },
    { title: 'Тайная жизнь Уолтера Митти', titleRaw: 'The Secret Life of Walter Mitty', overview: 'Офисный мечтатель отправляется в невероятное путешествие по миру.',                          overviewRaw: 'When his job along with that of his co-worker are threatened, Walter takes action in the real world, embarking on a global journey.', posterUrl: null, rating: 7.3, year: '2013', translated: true },
  ]
  const excludeSet = new Set(exclude.map(t => t.toLowerCase()))
  const available  = fallback.filter(m => !excludeSet.has(m.titleRaw.toLowerCase()))
  const source     = available.length > 0 ? available : fallback
  return source[Math.floor(Math.random() * source.length)]
}
