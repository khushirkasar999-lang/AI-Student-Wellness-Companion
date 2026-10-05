import { config as dotenvConfig } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Always load .env from backend/ regardless of cwd
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, "../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  // SQLite file path (relative to project root) or ":memory:"
  dbPath: process.env.DB_PATH ?? "backend/data/wellness.db",
  jwtSecret: requireEnv("JWT_SECRET"),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
