'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { optimizeImages } from '@/lib/imageOptimization'
import { cacheManager } from '@/lib/cache'

type ResultType = 'description' | 'exhibition' | 'poster' | null

interface PaintingDescription {
  imageName: string
  description: string
}

interface ExhibitionOption {
  id: number
  title: string
}

interface PosterResult {
  poster: string
  description: string
}

// Константы валидации
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export default function Home() {
  const [images, setImages] = useState<File[]>([])
  const [resultType, setResultType] = useState<ResultType>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [descriptions, setDescriptions] = useState<PaintingDescription[]>([])
  const [exhibitionOptions, setExhibitionOptions] = useState<ExhibitionOption[]>([])
  const [selectedExhibition, setSelectedExhibition] = useState<ExhibitionOption | null>(null)
  const [posterResult, setPosterResult] = useState<PosterResult | null>(null)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [optimizing, setOptimizing] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Очистка ресурсов при размонтировании
  useEffect(() => {
    return () => {
      // Очистка таймера дебаунсинга
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // Отмена активных запросов
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Валидация изображений
  const validateImages = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    if (files.length > MAX_FILES) {
      errors.push(`Максимальное количество файлов: ${MAX_FILES}. Выбрано: ${files.length}`)
      return { valid, errors }
    }

    files.forEach((file) => {
      // Проверка типа файла
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`Файл "${file.name}" имеет недопустимый формат. Разрешены: JPEG, PNG, WebP, GIF`)
        return
      }

      // Проверка размера файла
      if (file.size > MAX_FILE_SIZE) {
        errors.push(
          `Файл "${file.name}" слишком большой (${(file.size / 1024 / 1024).toFixed(2)} MB). Максимум: ${MAX_FILE_SIZE / 1024 / 1024} MB`
        )
        return
      }

      valid.push(file)
    })

    return { valid, errors }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      console.log(`Выбрано файлов: ${files.length}`, files.map(f => f.name))
      const { valid, errors } = validateImages(files)
      console.log(`Валидных файлов: ${valid.length}`, valid.map(f => f.name))

      if (errors.length > 0) {
        setError(errors.join('\n'))
        // Сбрасываем input даже при ошибке
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      if (valid.length === 0) {
        setError('Нет валидных изображений для загрузки')
        // Сбрасываем input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Оптимизируем изображения
      setOptimizing(true)
      setError(null)
      try {
        const optimizedFiles = await optimizeImages(valid)
        // Заменяем все файлы новыми (при новом выборе)
        setImages(optimizedFiles)
        setResult(null)
        setResultType(null)
        setError(null)
        setDescriptions([])
        setExhibitionOptions([])
        setSelectedExhibition(null)
        setPosterResult(null)
        setProgress(null)
        setRetryCount(0)
        // Очищаем кэш при загрузке новых изображений
        cacheManager.clear()
      } catch (err) {
        console.error('Ошибка при оптимизации изображений:', err)
        // В случае ошибки используем оригинальные файлы
        setImages(valid)
      } finally {
        setOptimizing(false)
        // Сбрасываем значение input после обработки
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  // Функция для выполнения запроса с retry
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    maxRetries = 2
  ): Promise<Response> => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current.signal,
        })

        if (response.ok) {
          setRetryCount(0)
          return response
        }

        // Если это последняя попытка, выбрасываем ошибку
        if (attempt === maxRetries) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Ждем перед повтором (экспоненциальная задержка)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        setRetryCount(attempt + 1)
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        // Если это не последняя попытка и ошибка не связана с отменой, продолжаем
        if (attempt < maxRetries && err instanceof Error && err.name !== 'AbortError') {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          setRetryCount(attempt + 1)
          continue
        }

        // Если это отмена или последняя попытка, выбрасываем ошибку
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('Запрос был отменен')
        }

        if (attempt === maxRetries) {
          throw lastError
        }
      }
    }

    throw lastError || new Error('Неизвестная ошибка')
  }

  // Дебаунсинг для предотвращения множественных кликов
  const debouncedHandler = useCallback((handler: () => void) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      handler()
    }, 300)
  }, [])

  // Генерация ключа кэша на основе изображений
  const generateImageCacheKey = (files: File[]): string => {
    return files
      .map((f) => `${f.name}-${f.size}-${f.lastModified}`)
      .join('|')
  }

  const handleDescription = async () => {
    if (images.length === 0) {
      setError('Пожалуйста, загрузите картинки')
      return
    }

    // Проверяем кэш
    const cacheKey = generateImageCacheKey(images)
    const cached = cacheManager.get<PaintingDescription[]>('descriptions', cacheKey)
    
    if (cached) {
      setDescriptions(cached)
      setResultType('description')
      const formattedDescriptions = cached
        .map(
          (desc: PaintingDescription) =>
            `## ${desc.imageName}\n\n${desc.description}`
        )
        .join('\n\n---\n\n')
      setResult(formattedDescriptions)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setResultType('description')
    setResult(null)
    setProgress({ current: 0, total: images.length })

    try {
      const formData = new FormData()
      images.forEach((image) => {
        formData.append('images', image)
      })

      const response = await fetchWithRetry('/api/describe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при генерации описаний')
      }

      if (data.success && data.descriptions) {
        // Сохраняем в кэш
        cacheManager.set('descriptions', cacheKey, data.descriptions)
        
        setDescriptions(data.descriptions)
        setProgress({ current: images.length, total: images.length })
        // Форматируем описания для отображения
        const formattedDescriptions = data.descriptions
          .map(
            (desc: PaintingDescription, index: number) =>
              `## ${desc.imageName}\n\n${desc.description}`
          )
          .join('\n\n---\n\n')
        setResult(formattedDescriptions)
      } else {
        throw new Error('Неожиданный формат ответа от сервера')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Произошла ошибка при генерации описаний'
      
      // Более понятные сообщения об ошибках
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('AbortError') || errorMessage.includes('отменен')) {
        userFriendlyMessage = 'Запрос был отменен'
      } else if (errorMessage.includes('timeout') || errorMessage.includes('таймаут')) {
        userFriendlyMessage = 'Превышено время ожидания. Попробуйте еще раз или уменьшите количество изображений.'
      } else if (errorMessage.includes('network') || errorMessage.includes('сеть')) {
        userFriendlyMessage = 'Ошибка сети. Проверьте подключение к интернету и попробуйте еще раз.'
      }
      
      setError(userFriendlyMessage)
      setResult(null)
      console.error('Ошибка при генерации описаний:', err)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const handleExhibition = async () => {
    if (images.length === 0) {
      setError('Пожалуйста, загрузите картинки')
      return
    }

    // Если описания еще не сгенерированы, сначала генерируем их
    if (descriptions.length === 0) {
      setError('Сначала сгенерируйте описания картин, нажав кнопку "Описание"')
      return
    }

    // Проверяем кэш
    const descriptionsText = descriptions.map((desc) => desc.description).join('|')
    const cached = cacheManager.get<ExhibitionOption[]>('exhibition', descriptionsText)
    
    if (cached) {
      setExhibitionOptions(cached)
      setResultType('exhibition')
      setResult(null)
      setSelectedExhibition(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setResultType('exhibition')
    setResult(null)
    setSelectedExhibition(null)

    try {
      const response = await fetchWithRetry(
        '/api/exhibition',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            descriptions: descriptions.map((desc) => desc.description),
          }),
        },
        2
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при генерации названий выставки')
      }

      if (data.success && data.options) {
        // Сохраняем в кэш
        cacheManager.set('exhibition', descriptionsText, data.options)
        setExhibitionOptions(data.options)
      } else {
        throw new Error('Неожиданный формат ответа от сервера')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Произошла ошибка при генерации названий выставки'
      
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('отменен')) {
        userFriendlyMessage = 'Запрос был отменен'
      } else if (errorMessage.includes('timeout') || errorMessage.includes('таймаут')) {
        userFriendlyMessage = 'Превышено время ожидания. Попробуйте еще раз.'
      }
      
      setError(userFriendlyMessage)
      console.error('Ошибка при генерации названий выставки:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePoster = async () => {
    if (!selectedExhibition) {
      setError('Пожалуйста, сначала выберите вариант названия выставки')
      return
    }

    // Проверяем кэш
    const cacheKey = `${selectedExhibition.title}|${descriptions.map((d) => d.description).join('|')}`
    const cached = cacheManager.get<PosterResult>('poster', cacheKey)
    
    if (cached) {
      setPosterResult(cached)
      setResultType('poster')
      const formattedResult = `## Макет афиши\n\n${cached.poster}\n\n## Описание выставки\n\n${cached.description}`
      setResult(formattedResult)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setResultType('poster')
    setResult(null)
    setPosterResult(null)

    try {
      const response = await fetchWithRetry(
        '/api/poster',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exhibitionTitle: selectedExhibition.title,
            descriptions: descriptions.map((desc) => desc.description),
          }),
        },
        2
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при генерации афиши')
      }

      if (data.success && data.result) {
        // Сохраняем в кэш
        cacheManager.set('poster', cacheKey, data.result)
        
        setPosterResult(data.result)
        // Форматируем результат для отображения
        const formattedResult = `## Макет афиши\n\n${data.result.poster}\n\n## Описание выставки\n\n${data.result.description}`
        setResult(formattedResult)
      } else {
        throw new Error('Неожиданный формат ответа от сервера')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Произошла ошибка при генерации афиши'
      
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('отменен')) {
        userFriendlyMessage = 'Запрос был отменен'
      } else if (errorMessage.includes('timeout') || errorMessage.includes('таймаут')) {
        userFriendlyMessage = 'Превышено время ожидания. Попробуйте еще раз.'
      }
      
      setError(userFriendlyMessage)
      setResult(null)
      console.error('Ошибка при генерации афиши:', err)
    } finally {
      setLoading(false)
    }
  }

  // Функция для отмены текущего запроса
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(false)
    setProgress(null)
    setError('Запрос отменен')
  }

  const handleSelectExhibition = (option: ExhibitionOption) => {
    setSelectedExhibition(option)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Генератор описания
        </h1>

        {/* Поле для загрузки картинок */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            Загрузите фото картин
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-gray-600">
                Нажмите для загрузки или перетащите файлы
              </span>
            </label>
          </div>
          {optimizing && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚙️ Оптимизация изображений...
              </p>
            </div>
          )}
          {images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Загружено картинок: {images.length} / {MAX_FILES}
              </p>
              {images.length === 1 && (
                <p className="text-xs text-yellow-600 mb-2">
                  💡 Вы можете выбрать несколько файлов одновременно, удерживая Ctrl (или Cmd на Mac) при выборе
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span>{img.name}</span>
                    <span className="text-blue-600">
                      ({(img.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                if (!loading) {
                  debouncedHandler(handleDescription)
                }
              }}
              disabled={loading || images.length === 0 || optimizing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              Описание
            </button>
            <button
              onClick={() => {
                if (!loading) {
                  debouncedHandler(handleExhibition)
                }
              }}
              disabled={loading || images.length === 0 || descriptions.length === 0 || optimizing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              Выставка
            </button>
            <button
              onClick={() => {
                if (!loading) {
                  debouncedHandler(handlePoster)
                }
              }}
              disabled={loading || !selectedExhibition || optimizing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              Афиша
            </button>
          </div>
        </div>

        {/* Блок для отображения результатов */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Результат
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">⚠️ {error}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 mb-2">
                {resultType === 'description' && 'Генерация описаний картин...'}
                {resultType === 'exhibition' && 'Генерация вариантов названий выставки...'}
                {resultType === 'poster' && 'Генерация макета афиши...'}
                {!resultType && 'Обработка...'}
              </p>
              {progress && (
                <div className="w-full max-w-md">
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Обработано: {progress.current} из {progress.total}
                  </p>
                </div>
              )}
              {retryCount > 0 && (
                <p className="text-sm text-yellow-600 mt-2">
                  Повторная попытка {retryCount}...
                </p>
              )}
              <button
                onClick={handleCancel}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Отменить
              </button>
            </div>
          )}

          {!loading && resultType === 'exhibition' && exhibitionOptions.length > 0 && (
            <div className="space-y-3">
              <p className="text-gray-700 font-medium mb-4">
                Выберите один из вариантов названия выставки:
              </p>
              {exhibitionOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectExhibition(option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedExhibition?.id === option.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <span className="font-semibold text-gray-800">{option.title}</span>
                </button>
              ))}
              {selectedExhibition && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✓ Выбрано: {selectedExhibition.title}
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && result && resultType === 'description' && (
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="text-gray-700 whitespace-pre-wrap">{result}</div>
              </div>
            </div>
          )}

          {!loading && result && resultType === 'poster' && posterResult && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-xl font-semibold text-purple-900 mb-3">
                  Макет афиши
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{posterResult.poster}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">
                  Описание выставки
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {posterResult.description}
                </p>
              </div>
            </div>
          )}

          {!loading && !result && resultType !== 'exhibition' && !error && (
            <div className="text-center py-8 text-gray-400">
              <p>Результаты будут отображены здесь</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
