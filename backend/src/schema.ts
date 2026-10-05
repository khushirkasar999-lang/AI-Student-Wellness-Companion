import type Database from "better-sqlite3";

/**
 * Creates all tables if they don't exist.
 * Runs synchronously at server startup via db.exec().
 *
 * SQLite differences from the original PostgreSQL schema:
 *  - SERIAL PRIMARY KEY  → INTEGER PRIMARY KEY AUTOINCREMENT
 *  - BOOLEAN             → INTEGER  (0 = false, 1 = true)
 *  - JSONB               → TEXT     (stored as JSON strings)
 *  - TIMESTAMP DEFAULT NOW() → TEXT DEFAULT (datetime('now'))
 *  - TEXT UNIQUE NOT NULL stays the same
 */
export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      email        TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role         TEXT NOT NULL DEFAULT 'student',
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                 INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name                    TEXT,
      course                  TEXT,
      academic_year           TEXT,
      preferred_language      TEXT,
      preferred_activity      TEXT,
      available_daily_minutes INTEGER DEFAULT 30,
      notification_preferences TEXT DEFAULT '{"email":true}',
      created_at              TEXT DEFAULT (datetime('now')),
      updated_at              TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sleep_duration       REAL,
      sleep_quality        INTEGER,
      academic_workload    INTEGER,
      deadline_pressure    INTEGER,
      study_hours          REAL,
      mood                 INTEGER,
      energy               INTEGER,
      physical_activity    INTEGER,
      social_connectedness INTEGER,
      financial_concern    INTEGER,
      self_reported_stress INTEGER,
      note                 TEXT DEFAULT '',
      safety_flag          INTEGER DEFAULT 0,
      created_at           TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stress_results (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      checkin_id           INTEGER NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
      score                INTEGER NOT NULL,
      level                TEXT NOT NULL,
      contributing_factors TEXT,
      engine_version       TEXT DEFAULT 'rule-engine-v1.0',
      created_at           TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category                TEXT NOT NULL,
      title                   TEXT NOT NULL,
      description             TEXT NOT NULL,
      rule_key                TEXT NOT NULL,
      estimated_minutes       INTEGER DEFAULT 10,
      active                  INTEGER DEFAULT 1,
      recommendation_status   TEXT DEFAULT 'pending',
      shown_at                TEXT DEFAULT (datetime('now')),
      completed_at            TEXT,
      created_at              TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recommendation_events (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recommendation_id INTEGER REFERENCES recommendations(id),
      status            TEXT DEFAULT 'shown',
      shown_at          TEXT DEFAULT (datetime('now')),
      completed_at      TEXT
    );

    CREATE TABLE IF NOT EXISTS consent_records (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      consent_type TEXT NOT NULL,
      version      TEXT NOT NULL,
      granted_at   TEXT DEFAULT (datetime('now')),
      revoked_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER REFERENCES users(id),
      action        TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id   TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );
  `);
}
