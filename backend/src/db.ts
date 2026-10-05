/**
 * SQLite database layer using better-sqlite3.
 *
 * better-sqlite3 is synchronous, so we wrap everything in a thin async
 * interface that matches the existing `query(sql, params)` call signature
 * used throughout index.ts — callers need no changes.
 *
 * PostgreSQL differences handled here:
 *  - $1/$2/… placeholders → ? placeholders
 *  - RETURNING * → last-insert-rowid + SELECT
 *  - NOW()       → CURRENT_TIMESTAMP (handled in schema / queries)
 *  - SERIAL      → INTEGER PRIMARY KEY AUTOINCREMENT (handled in schema)
 *  - BOOLEAN     → INTEGER 0/1 (SQLite stores booleans as integers)
 *  - JSONB       → TEXT (we JSON.stringify on write, parse on read)
 */

import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { initSchema } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve DB file path: config.dbPath is relative to project root
const dbPath =
  config.dbPath === ":memory:"
    ? ":memory:"
    : resolve(__dirname, "../../", config.dbPath);

export const db = new Database(dbPath);

// Performance pragmas
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Auto-create all tables on startup
initSchema(db);

/**
 * Replace PostgreSQL $1/$2/… with SQLite ? placeholders.
 */
function convertPlaceholders(sql: string): string {
  return sql.replace(/\$\d+/g, "?");
}

/**
 * Parse JSON columns in a row object.
 * Columns named *_preferences or contributing_factors are stored as JSON text.
 */
function parseRow(row: Record<string, unknown>): Record<string, unknown> {
  const jsonCols = ["notification_preferences", "contributing_factors"];
  const out: Record<string, unknown> = { ...row };
  for (const col of jsonCols) {
    if (typeof out[col] === "string") {
      try { out[col] = JSON.parse(out[col] as string); } catch { /* leave as-is */ }
    }
  }
  // Normalise SQLite integer booleans → JS booleans
  for (const col of ["safety_flag", "active"]) {
    if (typeof out[col] === "number") out[col] = out[col] === 1;
  }
  return out;
}

/**
 * Execute a SQL statement.
 * For SELECT → returns array of rows.
 * For INSERT/UPDATE/DELETE with RETURNING → emulates RETURNING by fetching the row.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const converted = convertPlaceholders(sql.trim());
  const upper = converted.toUpperCase();

  if (upper.startsWith("SELECT")) {
    const stmt = db.prepare(converted);
    const rows = stmt.all(...params) as Record<string, unknown>[];
    return rows.map(parseRow) as T[];
  }

  // INSERT / UPDATE / DELETE
  const hasReturning = /RETURNING\s+\*/i.test(converted);

  if (hasReturning) {
    // Strip the RETURNING * clause — SQLite doesn't support it
    const cleanSql = converted.replace(/\s+RETURNING\s+\*/i, "");

    if (upper.startsWith("INSERT")) {
      const stmt = db.prepare(cleanSql);
      const info = stmt.run(...params);
      const lastId = info.lastInsertRowid;

      // Determine table name from INSERT INTO <table>
      const tableMatch = cleanSql.match(/INSERT\s+INTO\s+(\w+)/i);
      if (tableMatch) {
        const table = tableMatch[1];
        const row = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(lastId) as Record<string, unknown>;
        return row ? [parseRow(row) as T] : [];
      }
      return [];
    }

    if (upper.startsWith("UPDATE")) {
      // Extract WHERE clause to re-fetch the updated row
      const stmt = db.prepare(cleanSql);
      stmt.run(...params);

      // Fetch the WHERE clause portion to retrieve updated row
      const whereMatch = cleanSql.match(/WHERE\s+(.+?)(?:\s+RETURNING|$)/is);
      const tableMatch = cleanSql.match(/UPDATE\s+(\w+)\s+SET/i);
      if (whereMatch && tableMatch) {
        const table = tableMatch[1];
        const whereClause = whereMatch[1];
        // Extract params for WHERE: they are the last N params corresponding to
        // the number of ? placeholders in the WHERE clause
        const setSection = cleanSql.match(/SET\s+(.+?)\s+WHERE/is)?.[1] ?? "";
        const setParamCount = (setSection.match(/\?/g) ?? []).length;
        const whereParams = params.slice(setParamCount);
        const row = db
          .prepare(`SELECT * FROM ${table} WHERE ${whereClause}`)
          .get(...whereParams) as Record<string, unknown>;
        return row ? [parseRow(row) as T] : [];
      }
      return [];
    }
  }

  // Plain INSERT / UPDATE / DELETE (no RETURNING)
  const stmt = db.prepare(converted);
  stmt.run(...params);
  return [];
}
