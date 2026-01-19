# Инструкция по установке и запуску CONNECTOR

## Требования

- Node.js 18+
- MongoDB (локально или MongoDB Atlas)
- npm или yarn

## Установка

### 1. Установка зависимостей фронтенда

```bash
npm install
```

### 2. Установка зависимостей бекенда

```bash
cd server
npm install
cd ..
```

### 3. Настройка переменных окружения

Создайте файл `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/connector
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Для фронтенда** создайте файл `.env` в корне проекта:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Запуск MongoDB

Убедитесь, что MongoDB запущен:

```bash
# Если MongoDB установлен локально
mongod

# Или используйте MongoDB Atlas и укажите connection string в MONGODB_URI
```

### 5. Запуск сервера

В одном терминале запустите бекенд:

```bash
cd server
npm run dev
```

Бекенд будет доступен на `http://localhost:5000`

### 6. Запуск фронтенда

В другом терминале запустите фронтенд:

```bash
npm run dev
```

Фронтенд будет доступен на `http://localhost:5173`

## Использование

### Регистрация пользователя

1. Откройте `http://localhost:5173`
2. Нажмите "Войти"
3. Переключитесь на "Регистрация"
4. Заполните все поля:
   - Email
   - Пароль
   - Имя
   - Фамилия
   - Телефон
   - Город
5. Нажмите "Создать аккаунт"

### Создание админа

Для создания администратора используйте MongoDB shell или MongoDB Compass:

```javascript
use connector
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Или создайте через API (нужно будет добавить endpoint для создания админа).

### Функции

- ✅ Регистрация и авторизация с JWT
- ✅ Личный кабинет клиента (/dashboard)
- ✅ Админ-панель (/manager)
- ✅ Real-time чат через Socket.io
- ✅ Загрузка файлов (любые типы)
- ✅ Управление заказами
- ✅ Уведомления о новых сообщениях
- ✅ Поиск и фильтрация чатов
- ✅ Информация о клиенте в чате (телефон, город)
- ✅ Адаптивный дизайн

## Структура проекта

```
firebaseproject/
├── server/              # Backend
│   ├── config/         # Конфигурация БД
│   ├── models/         # Mongoose модели
│   ├── routes/         # API routes
│   ├── middleware/     # Middleware
│   ├── uploads/        # Загруженные файлы
│   └── server.js       # Главный файл сервера
├── src/                # Frontend
│   ├── components/     # React компоненты
│   ├── config/         # API и Socket конфигурация
│   └── ...
└── ...
```

## Решение проблем

### MongoDB не подключается

Убедитесь, что MongoDB запущен и URI в `.env` правильный.

### Socket.io не работает

Проверьте, что `CLIENT_URL` в `.env` совпадает с URL фронтенда.

### CORS ошибки

Убедитесь, что `CLIENT_URL` в `server/.env` указывает на правильный URL фронтенда.

## Production

Для production:

1. Установите `NODE_ENV=production`
2. Измените `JWT_SECRET` на безопасный случайный ключ
3. Используйте MongoDB Atlas или другой production MongoDB
4. Настройте HTTPS
5. Используйте переменные окружения для всех секретов
