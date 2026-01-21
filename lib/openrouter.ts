/**
 * Утилита для работы с OpenRouter AI API
 * Документация: https://openrouter.ai/docs
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
      url: string
    }
  }>
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  max_tokens?: number
  temperature?: number
}

export interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Отправляет запрос к OpenRouter API
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  }
): Promise<string> {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) {
    throw new Error('AI_API_KEY не установлен в переменных окружения')
  }

  const model = options?.model || process.env.AI_MODEL || 'openai/gpt-4o'
  const httpReferer = process.env.HTTP_REFERER || 'http://localhost:3000'

  const requestBody: OpenRouterRequest = {
    model,
    messages,
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature || 0.7,
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': httpReferer,
        'X-Title': 'Paintings Generator',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data: OpenRouterResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenRouter API вернул пустой ответ')
    }

    return data.choices[0].message.content
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Ошибка при вызове OpenRouter API: ${String(error)}`)
  }
}

/**
 * Конвертирует изображение (File или Buffer) в base64
 */
export async function imageToBase64(image: File | Buffer): Promise<string> {
  if (image instanceof File) {
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString('base64')
  }
  return image.toString('base64')
}

/**
 * Создает сообщение с изображением для OpenRouter API
 */
export function createImageMessage(
  imageBase64: string,
  textPrompt: string
): OpenRouterMessage {
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text: textPrompt,
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
        },
      },
    ],
  }
}
