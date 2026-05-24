/**
 * Сервис рецептов — TheMealDB + перевод через MyMemory API.
 * CORS-friendly, без ключа.
 */

export interface RecipeInfo {
  name: string             // переведённое название
  nameRaw: string          // оригинальное название
  category: string
  instructions: string     // переведённые инструкции (или оригинал)
  instructionsRaw: string
  imageUrl: string | null
  ingredients: string[]    // переведённые ингредиенты
  ingredientsRaw: string[] // оригинальные ингредиенты
  translated: boolean
}

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1'

/**
 * Перевести один текстовый чанк (до 450 символов) через MyMemory
 */
async function translateChunk(text: string): Promise<string> {
  if (!text.trim()) return text
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ru`
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
  if (!res.ok) throw new Error(`MyMemory ${res.status}`)
  const data = await res.json()
  const translated: string = data?.responseData?.translatedText
  if (!translated || translated === text) throw new Error('no translation')
  return translated
}

/**
 * Перевести длинный текст — режем по предложениям, куски до 450 символов
 */
async function translateLong(text: string): Promise<string> {
  const trimmed = text.substring(0, 1800)
  const CHUNK = 450
  if (trimmed.length <= CHUNK) {
    try { return await translateChunk(trimmed) } catch { return text }
  }
  const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed]
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + s).length > CHUNK) {
      if (current) chunks.push(current.trim())
      current = s
    } else {
      current += s
    }
  }
  if (current.trim()) chunks.push(current.trim())
  try {
    const translated = await Promise.all(chunks.map(c => translateChunk(c)))
    return translated.join(' ')
  } catch {
    return text
  }
}

/**
 * Перевести список ингредиентов одним запросом (объединяем через ";" )
 */
async function translateIngredients(ingredients: string[]): Promise<string[]> {
  if (!ingredients.length) return ingredients
  try {
    // Объединяем через || чтобы переводить одним запросом
    const joined = ingredients.join(' | ')
    if (joined.length > 450) {
      // Если слишком длинно — переводим по одному
      const translated = await Promise.all(
        ingredients.map(async ing => {
          try { return await translateChunk(ing.substring(0, 100)) } catch { return ing }
        })
      )
      return translated
    }
    const result = await translateChunk(joined)
    // Разбиваем обратно
    const parts = result.split('|').map(s => s.trim())
    if (parts.length === ingredients.length) return parts
    return ingredients // fallback если структура поломалась
  } catch {
    return ingredients
  }
}

/**
 * Получить случайный рецепт с переводом названия, ингредиентов и инструкций
 */
export async function getRandomRecipe(): Promise<RecipeInfo | null> {
  try {
    const res = await fetch(`${MEALDB_BASE}/random.php`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error('MealDB API error')
    const data = await res.json()
    const meal = data.meals?.[0]
    if (!meal) return null

    // Собираем ингредиенты
    const ingredientsRaw: string[] = []
    for (let i = 1; i <= 20; i++) {
      const ing     = meal[`strIngredient${i}`]
      const measure = meal[`strMeasure${i}`]
      if (ing && ing.trim()) {
        ingredientsRaw.push(`${measure?.trim() || ''} ${ing.trim()}`.trim())
      }
    }

    const nameRaw        = meal.strMeal ?? 'Unknown'
    const rawInstructions = (meal.strInstructions ?? '').substring(0, 1000)

    // Переводим всё параллельно
    let translatedName        = nameRaw
    let translatedInstructions = rawInstructions
    let translatedIngredients  = ingredientsRaw
    let translated = false

    try {
      const [tName, tInstr, tIngs] = await Promise.all([
        translateChunk(nameRaw).catch(() => nameRaw),
        translateLong(rawInstructions).catch(() => rawInstructions),
        translateIngredients(ingredientsRaw),
      ])
      translatedName         = tName !== nameRaw        ? tName  : nameRaw
      translatedInstructions = tInstr !== rawInstructions ? tInstr : rawInstructions
      translatedIngredients  = tIngs
      translated = tName !== nameRaw || tInstr !== rawInstructions
    } catch (e) {
      console.warn('Перевод не удался:', e)
    }

    return {
      name:            translatedName,
      nameRaw,
      category:        meal.strCategory ?? '',
      instructions:    translatedInstructions,
      instructionsRaw: rawInstructions,
      imageUrl:        meal.strMealThumb ?? null,
      ingredients:     translatedIngredients.slice(0, 10),
      ingredientsRaw:  ingredientsRaw.slice(0, 10),
      translated,
    }
  } catch (e) {
    console.warn('MealDB API недоступен', e)
    return {
      name:            'Паста с томатным соусом',
      nameRaw:         'Pasta with Tomato Sauce',
      category:        'Pasta',
      instructions:    'Отварить пасту al dente. Обжарить чеснок на оливковом масле, добавить томаты. Смешать с пастой, посыпать пармезаном.',
      instructionsRaw: 'Boil pasta al dente. Fry garlic in olive oil, add tomatoes. Mix with pasta, top with parmesan.',
      imageUrl:        null,
      ingredients:     ['400г пасты', '2 зубчика чеснока', '400г томатов', 'Оливковое масло', 'Пармезан'],
      ingredientsRaw:  ['400g pasta', '2 cloves garlic', '400g tomatoes', 'Olive oil', 'Parmesan'],
      translated:      true,
    }
  }
}
