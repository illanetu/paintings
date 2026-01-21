/**
 * Тесты для валидации изображений
 */

// Моки для File API
class MockFile {
  name: string
  size: number
  type: string
  lastModified: number

  constructor(name: string, size: number, type: string) {
    this.name = name
    this.size = size
    this.type = type
    this.lastModified = Date.now()
  }
}

describe('Валидация изображений', () => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
  const MAX_FILES = 10
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  function validateImages(files: MockFile[]): { valid: MockFile[]; errors: string[] } {
    const valid: MockFile[] = []
    const errors: string[] = []

    if (files.length > MAX_FILES) {
      errors.push(`Максимальное количество файлов: ${MAX_FILES}. Выбрано: ${files.length}`)
      return { valid, errors }
    }

    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`Файл "${file.name}" имеет недопустимый формат. Разрешены: JPEG, PNG, WebP, GIF`)
        return
      }

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

  test('должен принимать валидные изображения', () => {
    const files = [
      new MockFile('test1.jpg', 1024 * 1024, 'image/jpeg'),
      new MockFile('test2.png', 2 * 1024 * 1024, 'image/png'),
    ]

    const result = validateImages(files)
    expect(result.valid.length).toBe(2)
    expect(result.errors.length).toBe(0)
  })

  test('должен отклонять файлы с недопустимым форматом', () => {
    const files = [
      new MockFile('test.pdf', 1024, 'application/pdf'),
      new MockFile('test.txt', 1024, 'text/plain'),
    ]

    const result = validateImages(files)
    expect(result.valid.length).toBe(0)
    expect(result.errors.length).toBe(2)
  })

  test('должен отклонять файлы, превышающие максимальный размер', () => {
    const files = [
      new MockFile('large.jpg', 11 * 1024 * 1024, 'image/jpeg'), // 11 MB
    ]

    const result = validateImages(files)
    expect(result.valid.length).toBe(0)
    expect(result.errors.length).toBe(1)
    expect(result.errors[0]).toContain('слишком большой')
  })

  test('должен отклонять слишком много файлов', () => {
    const files = Array.from({ length: 11 }, (_, i) => 
      new MockFile(`test${i}.jpg`, 1024, 'image/jpeg')
    )

    const result = validateImages(files)
    expect(result.valid.length).toBe(0)
    expect(result.errors.length).toBe(1)
    expect(result.errors[0]).toContain('Максимальное количество файлов')
  })

  test('должен принимать максимальное количество файлов', () => {
    const files = Array.from({ length: 10 }, (_, i) => 
      new MockFile(`test${i}.jpg`, 1024, 'image/jpeg')
    )

    const result = validateImages(files)
    expect(result.valid.length).toBe(10)
    expect(result.errors.length).toBe(0)
  })

  test('должен фильтровать валидные и невалидные файлы', () => {
    const files = [
      new MockFile('valid1.jpg', 1024, 'image/jpeg'),
      new MockFile('invalid.pdf', 1024, 'application/pdf'),
      new MockFile('valid2.png', 1024, 'image/png'),
      new MockFile('too-large.jpg', 11 * 1024 * 1024, 'image/jpeg'),
    ]

    const result = validateImages(files)
    expect(result.valid.length).toBe(2)
    expect(result.errors.length).toBe(2)
  })
})
