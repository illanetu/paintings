'use client'

import { useState } from 'react'

type ResultType = 'description' | 'exhibition' | 'poster' | null

export default function Home() {
  const [images, setImages] = useState<File[]>([])
  const [resultType, setResultType] = useState<ResultType>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [exhibitionOptions, setExhibitionOptions] = useState<string[]>([])
  const [selectedExhibition, setSelectedExhibition] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setImages(files)
      setResult(null)
      setResultType(null)
      setExhibitionOptions([])
      setSelectedExhibition(null)
    }
  }

  const handleDescription = async () => {
    if (images.length === 0) {
      alert('Пожалуйста, загрузите картинки')
      return
    }
    setLoading(true)
    setResultType('description')
    // TODO: Интеграция с AI для генерации описаний
    setTimeout(() => {
      setResult('Описания картин будут сгенерированы здесь...')
      setLoading(false)
    }, 1000)
  }

  const handleExhibition = async () => {
    if (images.length === 0) {
      alert('Пожалуйста, загрузите картинки')
      return
    }
    setLoading(true)
    setResultType('exhibition')
    // TODO: Интеграция с AI для генерации вариантов названий
    setTimeout(() => {
      const options = [
        'Вариант 1: Современное искусство в фокусе',
        'Вариант 2: Художественное наследие',
        'Вариант 3: Визуальные истории'
      ]
      setExhibitionOptions(options)
      setResult(null)
      setLoading(false)
    }, 1000)
  }

  const handlePoster = async () => {
    if (!selectedExhibition) {
      alert('Пожалуйста, сначала выберите вариант названия выставки')
      return
    }
    setLoading(true)
    setResultType('poster')
    // TODO: Интеграция с AI для генерации афиши
    setTimeout(() => {
      setResult('Макет афиши и краткое описание будут сгенерированы здесь...')
      setLoading(false)
    }, 1000)
  }

  const handleSelectExhibition = (option: string) => {
    setSelectedExhibition(option)
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
          {images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Загружено картинок: {images.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    {img.name}
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
              onClick={handleDescription}
              disabled={loading || images.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              Описание
            </button>
            <button
              onClick={handleExhibition}
              disabled={loading || images.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              Выставка
            </button>
            <button
              onClick={handlePoster}
              disabled={loading || !selectedExhibition}
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
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && resultType === 'exhibition' && exhibitionOptions.length > 0 && (
            <div className="space-y-3">
              <p className="text-gray-700 font-medium mb-4">
                Выберите один из вариантов названия выставки:
              </p>
              {exhibitionOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectExhibition(option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedExhibition === option
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <span className="font-semibold text-gray-800">{option}</span>
                </button>
              ))}
              {selectedExhibition && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✓ Выбрано: {selectedExhibition}
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && result && (
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{result}</p>
              </div>
            </div>
          )}

          {!loading && !result && resultType !== 'exhibition' && (
            <div className="text-center py-8 text-gray-400">
              <p>Результаты будут отображены здесь</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
