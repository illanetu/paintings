# Инструкция по деплою на Vercel

## Быстрый старт

### 1. Подготовка репозитория

```powershell
git add .
git commit -m "Подготовка к деплою"
git push origin main
```

### 2. Создание проекта на Vercel

1. Откройте [https://vercel.com/new](https://vercel.com/new)
2. Войдите через GitHub
3. Найдите и импортируйте репозиторий `illanetu/paintings`
   - Если репозиторий не виден: нажмите "Adjust GitHub App Permissions →" и добавьте доступ к `paintings`
4. Настройки проекта (обычно определяются автоматически):
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`

### 3. Переменные окружения

**Важно:** Добавьте **до** первого деплоя в разделе "Environment Variables":

| Имя | Значение |
|-----|----------|
| `AI_API_KEY` | ваш API-ключ OpenRouter |
| `AI_MODEL` | `openai/gpt-4o` |
| `HTTP_REFERER` | URL проекта (например `https://ваш-проект.vercel.app`) |

> `HTTP_REFERER` можно указать после первого деплоя, затем обновить и сделать Redeploy.

### 4. Деплой

Нажмите "Deploy" и дождитесь завершения (1-3 минуты).

## Решение проблем

### Репозиторий не виден в списке

1. Нажмите "Adjust GitHub App Permissions →" на странице импорта
2. Выберите "Only select repositories" и добавьте `paintings`
3. Или через [GitHub Settings](https://github.com/settings/installations) → Vercel → Configure

### Имя проекта занято

Используйте другое имя проекта (например, `paintings-app`). Это не влияет на GitHub-репозиторий.

### Ошибка сборки

- Проверьте логи на Vercel
- Убедитесь, что сборка проходит локально: `pnpm build`

### «AI_API_KEY не установлен в переменных окружения»

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard) → ваш проект
2. **Settings** → **Environment Variables**
3. Добавьте переменные:
   - `AI_API_KEY` — API-ключ с [OpenRouter](https://openrouter.ai/keys)
   - `AI_MODEL` — `openai/gpt-4o`
   - `HTTP_REFERER` — URL вашего проекта (например `https://paintings-xxx.vercel.app`)
4. **Обязательно:** Deployments → три точки у последнего деплоя → **Redeploy**

Переменные применяются только после нового деплоя.

### Другие проблемы с API

- Проверьте логи: Vercel → проект → **Logs** (или **Functions** → Logs)
- Убедитесь, что `HTTP_REFERER` совпадает с доменом приложения

## Автоматический деплой

После настройки каждый `git push` в ветку `main` автоматически запускает новый деплой.
