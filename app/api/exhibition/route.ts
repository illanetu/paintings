import { NextRequest, NextResponse } from 'next/server'
import { callOpenRouter } from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 30

interface ExhibitionOption {
  id: number
  title: string
}

/**
 * Промпт для генерации вариантов названий выставки
 */
function createExhibitionPrompt(descriptions: string[]): string {
  const descriptionsText = descriptions
    .map((desc, index) => `Картина ${index + 1}:\n${desc}`)
    .join('\n\n---\n\n')

  return `На основе следующих описаний картин предложи 3 варианта названия для художественной выставки:

${descriptionsText}

Требования к названиям:
- Каждое название должно быть кратким (2-5 слов) и запоминающимся
- Названия должны отражать общую тематику и стиль выставки
- Названия должны подходить для художественной выставки
- Названия должны быть на русском языке

Верни ТОЛЬКО 3 варианта названий, каждое с новой строки, в формате:
1. [название]
2. [название]
3. [название]

Не добавляй никаких дополнительных комментариев или объяснений.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { descriptions } = body

    if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
      return NextResponse.json(
        { error: 'Не предоставлены описания картин' },
        { status: 400 }
      )
    }

    // Если descriptions - массив объектов с полем description, извлекаем только тексты
    const descriptionTexts = descriptions.map((desc: string | { description?: string }) => {
      if (typeof desc === 'string') {
        return desc
      }
      return desc.description || String(desc)
    })

    // Создаем промпт
    const prompt = createExhibitionPrompt(descriptionTexts)

    // Отправляем запрос к AI
    const response = await callOpenRouter(
      [
        {
          role: 'system',
          content: 'Ты эксперт по искусству и куратор выставок. Твоя задача - создавать креативные и запоминающиеся названия для художественных выставок.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        maxTokens: 300,
        temperature: 0.9, // Более высокая температура для креативности
      }
    )

    // Парсим ответ - извлекаем варианты названий
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const options: ExhibitionOption[] = []
    let id = 1

    for (const line of lines) {
      // Ищем паттерн "1. название" или "1) название" или просто название
      const match = line.match(/^\d+[\.\)]\s*(.+)$/)
      const title = match ? match[1].trim() : line.replace(/^\d+[\.\)]\s*/, '').trim()

      if (title && title.length > 0) {
        options.push({
          id: id++,
          title: title,
        })
      }

      // Ограничиваем до 3 вариантов
      if (options.length >= 3) {
        break
      }
    }

    // Если не удалось распарсить, создаем варианты из первых строк
    if (options.length === 0) {
      const firstThreeLines = lines.slice(0, 3)
      firstThreeLines.forEach((line, index) => {
        const cleanTitle = line.replace(/^\d+[\.\)]\s*/, '').trim()
        if (cleanTitle) {
          options.push({
            id: index + 1,
            title: cleanTitle,
          })
        }
      })
    }

    // Если все еще нет вариантов, возвращаем ошибку
    if (options.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать варианты названий' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      options: options.slice(0, 3), // Гарантируем максимум 3 варианта
    })
  } catch (error) {
    console.error('Ошибка в API /api/exhibition:', error)
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    )
  }
}
