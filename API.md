# API Документация

Документация по структуре API endpoints приложения для генерации описаний картин, названий выставок и афиш.

## Базовый URL

```
http://localhost:3000/api
```

В production замените на соответствующий домен.

## Общая информация

Все API endpoints используют:
- **Метод**: `POST`
- **Content-Type**: `application/json` (кроме `/api/describe`, который использует `multipart/form-data`)
- **Формат ответа**: JSON
- **Кодировка**: UTF-8

## Endpoints

### 1. `/api/describe` - Генерация описаний картин

Генерирует подробные описания для загруженных изображений картин с использованием AI.

#### Запрос

**Метод**: `POST`  
**Content-Type**: `multipart/form-data`

**Параметры**:
- `images` (File[], обязательный) - массив изображений для обработки
  - Максимальный размер файла: 10 MB
  - Максимальное количество файлов: 10
  - Разрешенные форматы: JPEG, PNG, WebP, GIF

**Пример запроса (curl)**:
```powershell
$formData = @{
    images = Get-Item "C:\path\to\painting1.jpg", "C:\path\to\painting2.png"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/describe" -Method Post -Form $formData
```

**Пример запроса (JavaScript/Fetch)**:
```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);

const response = await fetch('/api/describe', {
  method: 'POST',
  body: formData
});
```

#### Успешный ответ

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "descriptions": [
    {
      "imageName": "painting1.jpg",
      "description": "Подробное описание картины на русском языке..."
    },
    {
      "imageName": "painting2.png",
      "description": "Подробное описание второй картины..."
    }
  ],
  "total": 2
}
```

**Структура данных**:
- `success` (boolean) - флаг успешного выполнения
- `descriptions` (PaintingDescription[]) - массив описаний
  - `imageName` (string) - имя файла изображения
  - `description` (string) - сгенерированное описание картины
- `total` (number) - общее количество обработанных изображений

#### Ошибки

**400 Bad Request** - Не загружено ни одного изображения:
```json
{
  "error": "Не загружено ни одного изображения"
}
```

**400 Bad Request** - Нет валидных изображений:
```json
{
  "error": "Нет валидных изображений для обработки"
}
```

**500 Internal Server Error** - Внутренняя ошибка сервера:
```json
{
  "error": "Внутренняя ошибка сервера",
  "message": "Детали ошибки..."
}
```

**Примечание**: Если обработка одного изображения завершилась с ошибкой, оно все равно будет включено в ответ с сообщением об ошибке в поле `description`.

#### Таймаут

Максимальное время выполнения: **60 секунд**

---

### 2. `/api/exhibition` - Генерация вариантов названий выставки

Генерирует 3 варианта названий для художественной выставки на основе описаний картин.

#### Запрос

**Метод**: `POST`  
**Content-Type**: `application/json`

**Тело запроса**:
```json
{
  "descriptions": [
    "Описание первой картины...",
    "Описание второй картины...",
    "Описание третьей картины..."
  ]
}
```

**Параметры**:
- `descriptions` (string[], обязательный) - массив описаний картин
  - Минимум: 1 описание
  - Каждый элемент может быть строкой или объектом с полем `description`

**Пример запроса (curl)**:
```powershell
$body = @{
    descriptions = @(
        "Картина выполнена в стиле импрессионизма...",
        "Абстрактная композиция с яркими цветами..."
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/exhibition" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Пример запроса (JavaScript/Fetch)**:
```javascript
const response = await fetch('/api/exhibition', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    descriptions: [
      'Описание первой картины...',
      'Описание второй картины...'
    ]
  })
});
```

#### Успешный ответ

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "options": [
    {
      "id": 1,
      "title": "Импрессия цвета"
    },
    {
      "id": 2,
      "title": "Художественные образы"
    },
    {
      "id": 3,
      "title": "Палитра эмоций"
    }
  ]
}
```

**Структура данных**:
- `success` (boolean) - флаг успешного выполнения
- `options` (ExhibitionOption[]) - массив вариантов названий (всегда 3 элемента)
  - `id` (number) - уникальный идентификатор варианта (1, 2, 3)
  - `title` (string) - название выставки на русском языке

#### Ошибки

**400 Bad Request** - Не предоставлены описания картин:
```json
{
  "error": "Не предоставлены описания картин"
}
```

**500 Internal Server Error** - Не удалось сгенерировать варианты:
```json
{
  "error": "Не удалось сгенерировать варианты названий"
}
```

**500 Internal Server Error** - Внутренняя ошибка сервера:
```json
{
  "error": "Внутренняя ошибка сервера",
  "message": "Детали ошибки..."
}
```

#### Таймаут

Максимальное время выполнения: **30 секунд**

---

### 3. `/api/poster` - Генерация макета афиши

Генерирует макет афиши и краткое описание выставки на основе выбранного названия.

#### Запрос

**Метод**: `POST`  
**Content-Type**: `application/json`

**Тело запроса**:
```json
{
  "exhibitionTitle": "Импрессия цвета",
  "descriptions": [
    "Описание первой картины...",
    "Описание второй картины..."
  ]
}
```

**Параметры**:
- `exhibitionTitle` (string, обязательный) - выбранное название выставки
- `descriptions` (string[], опциональный) - массив описаний картин для контекста
  - Используются первые 3 описания
  - Каждый элемент может быть строкой или объектом с полем `description`

**Пример запроса (curl)**:
```powershell
$body = @{
    exhibitionTitle = "Импрессия цвета"
    descriptions = @(
        "Картина выполнена в стиле импрессионизма...",
        "Абстрактная композиция с яркими цветами..."
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/poster" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Пример запроса (JavaScript/Fetch)**:
```javascript
const response = await fetch('/api/poster', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    exhibitionTitle: 'Импрессия цвета',
    descriptions: [
      'Описание первой картины...',
      'Описание второй картины...'
    ]
  })
});
```

#### Успешный ответ

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "result": {
    "poster": "Макет афиши представляет собой вертикальную композицию...",
    "description": "Выставка 'Импрессия цвета' представляет коллекцию современных произведений, объединенных общей темой цветовых экспериментов и эмоциональных переживаний."
  }
}
```

**Структура данных**:
- `success` (boolean) - флаг успешного выполнения
- `result` (PosterResult) - результат генерации
  - `poster` (string) - подробное визуальное описание макета афиши
  - `description` (string) - краткое описание выставки (2-3 предложения)

#### Ошибки

**400 Bad Request** - Не указано название выставки:
```json
{
  "error": "Не указано название выставки"
}
```

**500 Internal Server Error** - Внутренняя ошибка сервера:
```json
{
  "error": "Внутренняя ошибка сервера",
  "message": "Детали ошибки..."
}
```

#### Таймаут

Максимальное время выполнения: **30 секунд**

---

## Типы данных

### PaintingDescription

```typescript
interface PaintingDescription {
  imageName: string;  // Имя файла изображения
  description: string; // Сгенерированное описание картины
}
```

### ExhibitionOption

```typescript
interface ExhibitionOption {
  id: number;   // Уникальный идентификатор (1, 2, 3)
  title: string; // Название выставки
}
```

### PosterResult

```typescript
interface PosterResult {
  poster: string;      // Описание макета афиши
  description: string; // Краткое описание выставки
}
```

## Ограничения и лимиты

### Изображения (`/api/describe`)
- Максимальный размер файла: **10 MB**
- Максимальное количество файлов: **10**
- Разрешенные форматы: JPEG, PNG, WebP, GIF
- Изображения автоматически оптимизируются перед обработкой:
  - Максимальный размер: 1920x1920 пикселей
  - Максимальный размер после сжатия: 500 KB

### Описания (`/api/exhibition`, `/api/poster`)
- Минимум описаний: **1**
- Рекомендуемое количество: **3-10** для лучших результатов
- Используются первые 3 описания для контекста в `/api/poster`

### Таймауты
- `/api/describe`: **60 секунд**
- `/api/exhibition`: **30 секунд**
- `/api/poster`: **30 секунд**

## Обработка ошибок

Все endpoints возвращают ошибки в едином формате:

```json
{
  "error": "Краткое описание ошибки",
  "message": "Детальное сообщение (опционально)"
}
```

### HTTP коды статусов

- `200 OK` - Успешный запрос
- `400 Bad Request` - Неверные параметры запроса
- `500 Internal Server Error` - Внутренняя ошибка сервера

## Примеры полного цикла

### 1. Генерация описаний → Названий → Афиши

```javascript
// Шаг 1: Генерация описаний
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);

const describeResponse = await fetch('/api/describe', {
  method: 'POST',
  body: formData
});
const { descriptions } = await describeResponse.json();

// Шаг 2: Генерация вариантов названий
const exhibitionResponse = await fetch('/api/exhibition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    descriptions: descriptions.map(d => d.description)
  })
});
const { options } = await exhibitionResponse.json();

// Шаг 3: Выбор названия и генерация афиши
const selectedTitle = options[0].title; // Выбираем первый вариант

const posterResponse = await fetch('/api/poster', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    exhibitionTitle: selectedTitle,
    descriptions: descriptions.map(d => d.description)
  })
});
const { result } = await posterResponse.json();

console.log('Макет афиши:', result.poster);
console.log('Описание выставки:', result.description);
```

### 2. Использование с обработкой ошибок

```javascript
async function generateExhibition(images) {
  try {
    // Генерация описаний
    const formData = new FormData();
    images.forEach(img => formData.append('images', img));
    
    const describeRes = await fetch('/api/describe', {
      method: 'POST',
      body: formData
    });
    
    if (!describeRes.ok) {
      const error = await describeRes.json();
      throw new Error(error.error || 'Ошибка генерации описаний');
    }
    
    const { descriptions } = await describeRes.json();
    
    // Генерация названий
    const exhibitionRes = await fetch('/api/exhibition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descriptions: descriptions.map(d => d.description)
      })
    });
    
    if (!exhibitionRes.ok) {
      const error = await exhibitionRes.json();
      throw new Error(error.error || 'Ошибка генерации названий');
    }
    
    const { options } = await exhibitionRes.json();
    
    return { descriptions, options };
  } catch (error) {
    console.error('Ошибка:', error.message);
    throw error;
  }
}
```

## Примечания

1. **Кэширование**: Результаты могут кэшироваться на клиенте для оптимизации повторных запросов с теми же данными.

2. **Последовательность**: Рекомендуется использовать endpoints в следующем порядке:
   - `/api/describe` → `/api/exhibition` → `/api/poster`

3. **AI модель**: По умолчанию используется модель `openai/gpt-4o`. Модель можно изменить через переменную окружения `AI_MODEL`.

4. **Язык**: Все описания и названия генерируются на русском языке.

5. **Оптимизация**: Изображения автоматически оптимизируются перед отправкой для уменьшения времени обработки и затрат на API.
