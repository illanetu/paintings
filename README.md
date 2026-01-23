# Paintings
На основе совокупного анализа загруженных картин предлагает 3 варианта названия выставки для выбора.
После выбора одного из вариантов — генерирут макет афиши и кратное описние
PROJECT.MD - лписание проекта
Минимальное приложение на Next.js

## Установка

1. Установите зависимости:

```powershell
pnpm install
```

2. Настройте API ключ OpenRouter:

Создайте файл `.env.local` в корне проекта на основе `env.example`:

```powershell
Copy-Item env.example .env.local
```

Затем откройте `.env.local` и добавьте свой API ключ OpenRouter:

```
AI_API_KEY=ваш_api_ключ_здесь
AI_MODEL=openai/gpt-4o
HTTP_REFERER=http://localhost:3000
```

Получить API ключ можно на [https://openrouter.ai/keys](https://openrouter.ai/keys)

OpenRouter предоставляет доступ к различным моделям AI (OpenAI, Anthropic, Google и др.). 
Список доступных моделей: [https://openrouter.ai/models](https://openrouter.ai/models)

## Запуск

Запустите приложение в режиме разработки:

```powershell
pnpm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Сборка

Для сборки production версии:

```powershell
pnpm run build
pnpm start
```

## Деплой на Vercel

### Первый деплой

1. Убедитесь, что проект загружен на GitHub в репозиторий `illanetu/paintings`

2. Перейдите на [Vercel](https://vercel.com) и войдите через GitHub

3. Нажмите "Add New Project" (Добавить новый проект)

4. Выберите репозиторий `illanetu/paintings`

5. **Важно:** Если появится ошибка "The specified name is already used for a different Git repository":
   - **Просто введите другое имя в поле "Private Repository Name"** (например, `paintings-app`, `paintings-generator` или `paintings-exhibition`)
   - Имя проекта на Vercel может отличаться от имени репозитория GitHub - это нормально!
   - Это не повлияет на работу проекта, URL будет сгенерирован автоматически
   - Не нужно искать старый проект - просто используйте другое имя

6. Настройте переменные окружения:
   - `AI_API_KEY` - ваш API ключ OpenRouter
   - `AI_MODEL` - модель AI (по умолчанию: `openai/gpt-4o`)
   - `HTTP_REFERER` - URL вашего проекта на Vercel (например, `https://your-project.vercel.app`)

7. Нажмите "Deploy" (Развернуть)

### Обновление проекта

После каждого push в ветку `main` на GitHub, Vercel автоматически развернет новую версию проекта.

### Переменные окружения на Vercel

После создания проекта:
1. Перейдите в настройки проекта на Vercel
2. Откройте раздел "Environment Variables"
3. Добавьте переменные:
   - `AI_API_KEY` = ваш API ключ OpenRouter
   - `AI_MODEL` = `openai/gpt-4o` (или другая модель)
   - `HTTP_REFERER` = URL вашего проекта на Vercel

### Если имя проекта занято

Если Vercel показывает ошибку, что имя "paintings" уже используется:
- **Просто используйте другое имя** - это самый простой способ
- Имя проекта на Vercel не связано с именем репозитория GitHub
- Ваш репозиторий останется `illanetu/paintings` на GitHub
- URL проекта будет автоматически сгенерирован (например, `paintings-app.vercel.app`)
