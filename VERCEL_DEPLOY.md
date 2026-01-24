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

**Важно:** Добавьте перед деплоем!

```
AI_API_KEY = ваш_api_ключ_openrouter
AI_MODEL = openai/gpt-4o
HTTP_REFERER = https://your-project-name.vercel.app
```

> Для `HTTP_REFERER` можно временно указать любой URL, затем обновить после первого деплоя на реальный домен проекта.

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

### API не работает

- Проверьте переменные окружения (`AI_API_KEY`, `HTTP_REFERER`)
- Проверьте логи функций: Vercel Dashboard → Functions → Logs

## Автоматический деплой

После настройки каждый `git push` в ветку `main` автоматически запускает новый деплой.
