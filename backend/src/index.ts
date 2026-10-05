import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import { query } from "./db.js";
import { buildStressExplanation, computeStressScore } from "./lib/stress.js";
import { generateRecommendations } from "./lib/recommendations.js";

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── Zod schemas ───────────────────────────────────────────────────────────────

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const profileSchema = z.object({
  name: z.string().min(1),
  course: z.string().min(1),
  academic_year: z.string().min(1),
  preferred_language: z.string().default("English"),
  preferred_activity: z.string().default("walk"),
  available_daily_minutes: z.number().min(10).max(180),
  notification_preferences: z
    .object({ email: z.boolean().default(true) })
    .default({ email: true }),
});

const checkinSchema = z.object({
  sleep_duration: z.number().min(0).max(12),
  sleep_quality: z.number().min(1).max(5),
  academic_workload: z.number().min(1).max(5),
  deadline_pressure: z.number().min(1).max(5),
  study_hours: z.number().min(0).max(20),
  mood: z.number().min(1).max(5),
  energy: z.number().min(1).max(5),
  physical_activity: z.number().min(1).max(5),
  social_connectedness: z.number().min(1).max(5),
  financial_concern: z.number().min(1).max(5),
  self_reported_stress: z.number().min(1).max(5),
  note: z.string().optional(),
});

// ── Auth middleware ───────────────────────────────────────────────────────────

const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") ?? req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, config.jwtSecret);
    const result = await query("SELECT * FROM users WHERE id = $1", [decoded.userId]);
    if (!result[0]) return res.status(401).json({ error: "Unauthorized" });

    req.user = result[0];
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, status: "healthy" });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;
  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing[0]) return res.status(409).json({ error: "User already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (email, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, 'student', datetime('now'), datetime('now')) RETURNING *`,
    [email, passwordHash]
  );

  const user = result[0] as any;
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
  return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role }, token });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  if (!result[0]) return res.status(401).json({ error: "Invalid credentials" });

  const user = result[0] as any;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
  return res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
});

// Logout
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

// Me
app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
  const profile = await query("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]);
  res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role }, profile: profile[0] ?? null });
});

// Get profile
app.get("/api/profile", authMiddleware, async (req: any, res) => {
  const profile = await query("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]);
  res.json(profile[0] ?? null);
});

// Upsert profile
app.put("/api/profile", authMiddleware, async (req: any, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid profile" });

  const d = parsed.data;
  const notifJson = JSON.stringify(d.notification_preferences);
  const existing = await query("SELECT id FROM profiles WHERE user_id = $1", [req.user.id]);

  if (existing[0]) {
    const updated = await query(
      `UPDATE profiles SET name=$1, course=$2, academic_year=$3, preferred_language=$4,
       preferred_activity=$5, available_daily_minutes=$6, notification_preferences=$7,
       updated_at=datetime('now') WHERE user_id=$8 RETURNING *`,
      [d.name, d.course, d.academic_year, d.preferred_language, d.preferred_activity,
       d.available_daily_minutes, notifJson, req.user.id]
    );
    return res.json(updated[0]);
  }

  const inserted = await query(
    `INSERT INTO profiles
       (user_id, name, course, academic_year, preferred_language, preferred_activity,
        available_daily_minutes, notification_preferences, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,datetime('now'),datetime('now')) RETURNING *`,
    [req.user.id, d.name, d.course, d.academic_year, d.preferred_language,
     d.preferred_activity, d.available_daily_minutes, notifJson]
  );
  return res.status(201).json(inserted[0]);
});

// Submit check-in
app.post("/api/checkins", authMiddleware, async (req: any, res) => {
  const parsed = checkinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid check-in" });

  const p = parsed.data;

  const checkinRes = await query(
    `INSERT INTO checkins
       (user_id, sleep_duration, sleep_quality, academic_workload, deadline_pressure,
        study_hours, mood, energy, physical_activity, social_connectedness,
        financial_concern, self_reported_stress, note, safety_flag, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,datetime('now')) RETURNING *`,
    [req.user.id, p.sleep_duration, p.sleep_quality, p.academic_workload,
     p.deadline_pressure, p.study_hours, p.mood, p.energy, p.physical_activity,
     p.social_connectedness, p.financial_concern, p.self_reported_stress, p.note ?? ""]
  );

  const checkin = checkinRes[0] as any;
  const stress = computeStressScore(p);
  const explanation = buildStressExplanation(stress);

  await query(
    `INSERT INTO stress_results (checkin_id, score, level, contributing_factors, engine_version, created_at)
     VALUES ($1,$2,$3,$4,$5,datetime('now'))`,
    [checkin.id, stress.score, stress.level, JSON.stringify(stress.factors), stress.engine_version]
  );

  // Persist recommendations to DB
  const existing = await query(
    "SELECT rule_key FROM recommendations WHERE user_id = $1 AND active = 1",
    [req.user.id]
  );
  const recs = generateRecommendations(stress, {}, existing);

  for (const rec of recs) {
    await query(
      `INSERT INTO recommendations
         (user_id, category, title, description, rule_key, estimated_minutes, active,
          recommendation_status, shown_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,1,'pending',datetime('now'),datetime('now'))`,
      [req.user.id, rec.category, rec.title, rec.description,
       rec.ruleKey, rec.estimatedMinutes]
    );
  }

  return res.status(201).json({
    checkin,
    stress: { ...stress, explanation },
    recommendations: recs,
  });
});

// List check-ins
app.get("/api/checkins", authMiddleware, async (req: any, res) => {
  const rows = await query(
    "SELECT * FROM checkins WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(rows);
});

// Latest stress
app.get("/api/stress/latest", authMiddleware, async (req: any, res) => {
  const rows = await query(
    `SELECT sr.score, sr.level, sr.contributing_factors, sr.engine_version, sr.created_at
     FROM stress_results sr
     JOIN checkins c ON c.id = sr.checkin_id
     WHERE c.user_id = $1
     ORDER BY sr.created_at DESC
     LIMIT 1`,
    [req.user.id]
  );
  res.json(rows[0] ?? null);
});

// Stress trends
app.get("/api/stress/trends", authMiddleware, async (req: any, res) => {
  const rows = await query(
    `SELECT sr.score, sr.created_at FROM stress_results sr
     JOIN checkins c ON c.id = sr.checkin_id
     WHERE c.user_id = $1
     ORDER BY sr.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// Dashboard
app.get("/api/dashboard", authMiddleware, async (req: any, res) => {
  const [profile, recentCheckins, latestStress, recommendations] = await Promise.all([
    query("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]),
    query("SELECT * FROM checkins WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", [req.user.id]),
    query(
      `SELECT sr.score, sr.level, sr.contributing_factors, sr.engine_version, sr.created_at
       FROM stress_results sr JOIN checkins c ON c.id = sr.checkin_id
       WHERE c.user_id = $1 ORDER BY sr.created_at DESC LIMIT 1`,
      [req.user.id]
    ),
    query(
      "SELECT * FROM recommendations WHERE user_id = $1 AND active = 1 ORDER BY created_at DESC LIMIT 5",
      [req.user.id]
    ),
  ]);

  res.json({
    profile: profile[0] ?? null,
    recentCheckins,
    latestStress: latestStress[0] ?? null,
    recommendations,
  });
});

// List recommendations
app.get("/api/recommendations", authMiddleware, async (req: any, res) => {
  const rows = await query(
    "SELECT * FROM recommendations WHERE user_id = $1 AND active = 1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(rows);
});

// Complete recommendation
app.post("/api/recommendations/:id/complete", authMiddleware, async (req: any, res) => {
  await query(
    "UPDATE recommendations SET active=0, completed_at=datetime('now') WHERE id=$1 AND user_id=$2",
    [req.params.id, req.user.id]
  );
  const rows = await query(
    "SELECT * FROM recommendations WHERE id=$1 AND user_id=$2",
    [req.params.id, req.user.id]
  );
  res.json(rows[0] ?? null);
});

// Privacy export
app.get("/api/privacy/export", authMiddleware, async (req: any, res) => {
  const [profile, checkins, stressResults] = await Promise.all([
    query("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]),
    query("SELECT * FROM checkins WHERE user_id = $1", [req.user.id]),
    query(
      `SELECT sr.* FROM stress_results sr
       JOIN checkins c ON c.id = sr.checkin_id
       WHERE c.user_id = $1`,
      [req.user.id]
    ),
  ]);
  res.json({ profile: profile[0] ?? null, checkins, stressResults });
});

// Delete account
app.delete("/api/account", authMiddleware, async (req: any, res) => {
  await query("DELETE FROM users WHERE id = $1", [req.user.id]);
  res.json({ ok: true });
});

app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`   Frontend: ${config.frontendUrl}`);
});
