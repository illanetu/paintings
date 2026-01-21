import { NextRequest, NextResponse } from 'next/server'
import { callOpenRouter } from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 30

interface PosterResult {
  poster: string // Описание макета афиши
  description: string // Краткое описание выставки
}

/**
 * Промпт для генерации афиши и описания выставки
 */
function createPosterPrompt(
  exhibitionTitle: string,
  paintingDescriptions?: string[]
): string {
  let context = ''

  if (paintingDescriptions && paintingDescriptions.length > 0) {
    const descriptionsText = paintingDescriptions
      .slice(0, 3) // Берем первые 3 описания для контекста
      .map((desc, index) => `Картина ${index + 1}: ${desc.substring(0, 200)}...`)
      .join('\n')

    context = `\n\nКонтекст выставки (описания некоторых картин):\n${descriptionsText}`
  }

  return `Создай макет афиши для художественной выставки с названием: "${exhibitionTitle}"${context}

Твоя задача:
1. Создать подробное визуальное описание макета афиши (дизайн, композиция, цветовая схема, расположение элементов)
2. Написать краткое описание выставки (2-3 предложения) для афиши

Формат ответа (строго соблюдай):
МАКЕТ АФИШИ:
[подробное описание макета афиши]

ОПИСАНИЕ ВЫСТАВКИ:
[краткое описание выставки 2-3 предложения]`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exhibitionTitle, descriptions } = body

    if (!exhibitionTitle || typeof exhibitionTitle !== 'string') {
      return NextResponse.json(
        { error: 'Не указано название выставки' },
        { status: 400 }
      )
    }

    // Подготавливаем описания картин (если есть)
    const paintingDescriptions: string[] = []
    if (descriptions && Array.isArray(descriptions)) {
      descriptions.forEach((desc: string | { description?: string }) => {
        if (typeof desc === 'string') {
          paintingDescriptions.push(desc)
        } else if (desc.description) {
          paintingDescriptions.push(desc.description)
        }
      })
    }

    // Создаем промпт
    const prompt = createPosterPrompt(exhibitionTitle, paintingDescriptions)

    // Отправляем запрос к AI
    const response = await callOpenRouter(
      [
        {
          role: 'system',
          content: 'Ты профессиональный дизайнер афиш и куратор художественных выставок. Твоя задача - создавать креативные и привлекательные макеты афиш с описаниями выставок.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        maxTokens: 1500,
        temperature: 0.8,
      }
    )

    // Парсим ответ
    const posterMatch = response.match(/МАКЕТ АФИШИ:\s*(.+?)(?=ОПИСАНИЕ ВЫСТАВКИ:|$)/is)
    const descriptionMatch = response.match(/ОПИСАНИЕ ВЫСТАВКИ:\s*(.+?)$/is)

    const poster = posterMatch
      ? posterMatch[1].trim()
      : 'Макет афиши будет создан дизайнером на основе концепции выставки.'

    const description = descriptionMatch
      ? descriptionMatch[1].trim()
      : response.split('ОПИСАНИЕ ВЫСТАВКИ:')[1]?.trim() ||
        'Выставка представляет коллекцию уникальных художественных произведений.'

    const result: PosterResult = {
      poster,
      description,
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Ошибка в API /api/poster:', error)
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    )
  }
}
