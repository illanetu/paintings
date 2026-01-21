import { NextRequest, NextResponse } from 'next/server'
import { callOpenRouter, imageToBase64, createImageMessage } from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 секунд для обработки нескольких изображений

interface PaintingDescription {
  imageName: string
  description: string
}

/**
 * Промпт для генерации описания картины
 */
const DESCRIPTION_PROMPT = `Проанализируй эту картину и создай подробное описание на русском языке. Включи следующую информацию:
- Стиль и техника исполнения
- Сюжет и композиция
- Цветовая палитра и использование цвета
- Художественные особенности и детали
- Общее впечатление и эмоциональное воздействие

Опиши картину подробно, но структурированно.`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Не загружено ни одного изображения' },
        { status: 400 }
      )
    }

    // Валидация файлов
    const validFiles = files.filter((file) => {
      return file && file.type.startsWith('image/')
    })

    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: 'Нет валидных изображений для обработки' },
        { status: 400 }
      )
    }

    const descriptions: PaintingDescription[] = []

    // Обрабатываем каждое изображение последовательно
    for (const file of validFiles) {
      try {
        // Конвертируем изображение в base64
        const imageBase64 = await imageToBase64(file)

        // Создаем сообщение с изображением
        const imageMessage = createImageMessage(imageBase64, DESCRIPTION_PROMPT)

        // Отправляем запрос к AI
        const description = await callOpenRouter(
          [imageMessage],
          {
            maxTokens: 1000,
            temperature: 0.7,
          }
        )

        descriptions.push({
          imageName: file.name,
          description: description.trim(),
        })
      } catch (error) {
        console.error(`Ошибка при обработке изображения ${file.name}:`, error)
        // Продолжаем обработку остальных изображений даже при ошибке
        descriptions.push({
          imageName: file.name,
          description: `Ошибка при генерации описания: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      descriptions,
      total: descriptions.length,
    })
  } catch (error) {
    console.error('Ошибка в API /api/describe:', error)
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    )
  }
}
