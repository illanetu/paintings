/**
 * Утилиты для оптимизации изображений перед отправкой
 */

const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const MAX_SIZE_KB = 500 // Максимальный размер после сжатия в KB
const QUALITY = 0.85 // Качество JPEG (0-1)

/**
 * Создает canvas элемент для обработки изображения
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Вычисляет новые размеры изображения с сохранением пропорций
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

/**
 * Сжимает изображение до указанного размера в KB
 */
async function compressToSize(
  canvas: HTMLCanvasElement,
  targetSizeKB: number,
  quality: number
): Promise<Blob> {
  let currentQuality = quality
  let blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', currentQuality)
  })

  // Если размер уже меньше целевого, возвращаем
  if (blob.size <= targetSizeKB * 1024) {
    return blob
  }

  // Уменьшаем качество пока не достигнем целевого размера
  const minQuality = 0.1
  const step = 0.1

  while (blob.size > targetSizeKB * 1024 && currentQuality > minQuality) {
    currentQuality = Math.max(minQuality, currentQuality - step)
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', currentQuality)
    })
  }

  return blob
}

/**
 * Оптимизирует изображение: ресайз и сжатие
 */
export async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const img = new Image()
        img.onload = async () => {
          try {
            // Вычисляем новые размеры
            const { width, height } = calculateDimensions(
              img.width,
              img.height,
              MAX_WIDTH,
              MAX_HEIGHT
            )

            // Создаем canvas и рисуем изображение
            const canvas = createCanvas(width, height)
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              reject(new Error('Не удалось создать контекст canvas'))
              return
            }

            // Используем сглаживание для лучшего качества
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, 0, 0, width, height)

            // Сжимаем до целевого размера
            const blob = await compressToSize(canvas, MAX_SIZE_KB, QUALITY)

            // Создаем новый File объект
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            resolve(optimizedFile)
          } catch (error) {
            reject(error)
          }
        }

        img.onerror = () => {
          reject(new Error('Ошибка при загрузке изображения'))
        }

        if (e.target?.result) {
          img.src = e.target.result as string
        } else {
          reject(new Error('Не удалось прочитать файл'))
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Ошибка при чтении файла'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Оптимизирует массив изображений
 */
export async function optimizeImages(files: File[]): Promise<File[]> {
  const optimizedFiles: File[] = []

  for (const file of files) {
    try {
      // Если файл уже маленький и в правильном формате, пропускаем оптимизацию
      if (file.size <= MAX_SIZE_KB * 1024 && file.type === 'image/jpeg') {
        optimizedFiles.push(file)
        continue
      }

      const optimized = await optimizeImage(file)
      optimizedFiles.push(optimized)
    } catch (error) {
      console.warn(`Не удалось оптимизировать файл ${file.name}:`, error)
      // В случае ошибки добавляем оригинальный файл
      optimizedFiles.push(file)
    }
  }

  return optimizedFiles
}
