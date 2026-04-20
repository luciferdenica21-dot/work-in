-- Запусти этот SQL в Supabase Dashboard → SQL Editor

-- 1. Таблица аналитики
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '/',
  section TEXT NOT NULL DEFAULT '',
  element TEXT NOT NULL DEFAULT '',
  service_key TEXT NOT NULL DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_action ON analytics_events(action);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp DESC);

-- 3. Колонка avatar_url в таблице users (для OAuth аватарок)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';

-- 4. Колонки для выбора типа аватарки и кастомного аватара
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type TEXT NOT NULL DEFAULT 'gravatar';
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT NOT NULL DEFAULT '';

-- 5. RLS отключаем (сервер использует service role key)
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
