CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  course TEXT,
  academic_year TEXT,
  preferred_language TEXT,
  preferred_activity TEXT,
  available_daily_minutes INTEGER DEFAULT 30,
  notification_preferences JSONB DEFAULT '{"email": true}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sleep_duration NUMERIC,
  sleep_quality INTEGER,
  academic_workload INTEGER,
  deadline_pressure INTEGER,
  study_hours INTEGER,
  mood INTEGER,
  energy INTEGER,
  physical_activity INTEGER,
  social_connectedness INTEGER,
  financial_concern INTEGER,
  self_reported_stress INTEGER,
  note TEXT,
  safety_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stress_results (
  id SERIAL PRIMARY KEY,
  checkin_id INTEGER NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  contributing_factors JSONB,
  engine_version TEXT DEFAULT 'rule-engine-v1.0',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  estimated_minutes INTEGER DEFAULT 10,
  active BOOLEAN DEFAULT TRUE,
  recommendation_status TEXT DEFAULT 'pending',
  shown_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id INTEGER REFERENCES recommendations(id),
  status TEXT DEFAULT 'shown',
  shown_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
