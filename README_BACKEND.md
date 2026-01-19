# CONNECTOR Backend

Полнофункциональный бекенд для CRM системы CONNECTOR.

## Технологии

- **Node.js** + **Express** - сервер
- **MongoDB** + **Mongoose** - база данных
- **Socket.io** - real-time коммуникация
- **JWT** - аутентификация
- **Multer** - загрузка файлов

## Установка

1. Перейдите в папку server:
```bash
cd server
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/connector
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

4. Убедитесь, что MongoDB запущен

5. Запустите сервер:
```bash
npm run dev
```

Сервер будет доступен на `http://localhost:5000`

## API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получить текущего пользователя
- `PUT /api/auth/profile` - Обновить профиль

### Чаты
- `GET /api/chats` - Получить все чаты (admin)
- `GET /api/chats/my-chat` - Получить свой чат (user)
- `GET /api/chats/:chatId/messages` - Получить сообщения чата
- `PUT /api/chats/:chatId/read` - Отметить чат как прочитанный

### Сообщения
- `POST /api/messages` - Отправить сообщение

### Заказы
- `POST /api/orders` - Создать заказ
- `PUT /api/orders/:chatId/:orderIndex/status` - Обновить статус заказа (admin)
- `DELETE /api/orders/:chatId/:orderIndex` - Удалить заказ (admin)

### Файлы
- `POST /api/files/upload` - Загрузить файл
- `GET /api/files/uploads/:filename` - Получить файл

## Socket.io Events

### Клиент -> Сервер
- `join-chat` - Присоединиться к чату
- `leave-chat` - Покинуть чат
- `send-message` - Отправить сообщение
- `mark-read` - Отметить как прочитанное

### Сервер -> Клиент
- `new-message` - Новое сообщение
- `new-chat-message` - Новое сообщение в чате (для админа)
- `chat-read` - Чат отмечен как прочитанный

## Структура проекта

```
server/
├── config/
│   └── database.js       # Подключение к MongoDB
├── models/
│   ├── User.js          # Модель пользователя
│   ├── Chat.js          # Модель чата
│   ├── Message.js       # Модель сообщения
├── middleware/
│   ├── auth.js          # JWT аутентификация
│   └── upload.js        # Multer конфигурация
├── routes/
│   ├── auth.js          # Роуты авторизации
│   ├── chats.js         # Роуты чатов
│   ├── messages.js      # Роуты сообщений
│   ├── orders.js        # Роуты заказов
│   └── files.js         # Роуты файлов
├── uploads/             # Загруженные файлы
└── server.js            # Главный файл сервера
```

## Особенности

- ✅ JWT аутентификация
- ✅ Real-time чат через Socket.io
- ✅ Загрузка файлов любого типа
- ✅ CRM функциональность для админов
- ✅ Личный кабинет для клиентов
- ✅ Поддержка непрочитанных сообщений
- ✅ Уведомления в реальном времени
