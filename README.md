# Paintings
На основе совокупного анализа загруженных картин предлагает 3 варианта названия выставки для выбора.
После выбора одного из вариантов — генерирут макет афиши и кратное описние
PROJECT.MD - лписание проекта
Минимальное приложение на Next.js

## Установка

1. Установите зависимости:

```powershell
npm install
```

2. Настройте API ключ OpenAI:

Создайте файл `.env.local` в корне проекта на основе `env.example`:

```powershell
Copy-Item env.example .env.local
```

Затем откройте `.env.local` и добавьте свой API ключ OpenAI:

```
AI_API_KEY=ваш_api_ключ_здесь
AI_MODEL=gpt-4o
```

Получить API ключ можно на [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Запуск

Запустите приложение в режиме разработки:

```powershell
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Сборка

Для сборки production версии:

```powershell
npm run build
npm start
```
