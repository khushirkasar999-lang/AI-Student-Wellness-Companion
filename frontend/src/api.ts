/**
 * Typed API client — all calls go through /api (proxied to :4000 in dev).
 * The JWT is stored in localStorage and sent as a Bearer token.
 */

const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
  profile: Profile | null;
}

export const authApi = {
  register: (email: string, password: string) =>
    request<AuthResponse>("POST", "/auth/register", { email, password }),

  login: (email: string, password: string) =>
    request<AuthResponse>("POST", "/auth/login", { email, password }),

  logout: () => request<void>("POST", "/auth/logout"),

  me: () => request<MeResponse>("GET", "/auth/me"),
};

// ── Profile ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: number;
  user_id: number;
  name: string;
  course: string;
  academic_year: string;
  preferred_language: string;
  preferred_activity: string;
  available_daily_minutes: number;
  notification_preferences: { email: boolean };
}

export type ProfilePayload = Omit<Profile, "id" | "user_id">;

export const profileApi = {
  get: () => request<Profile | null>("GET", "/profile"),
  upsert: (data: ProfilePayload) => request<Profile>("PUT", "/profile", data),
};

// ── Check-ins ────────────────────────────────────────────────────────────────

export interface CheckinPayload {
  sleep_duration: number;
  sleep_quality: number;
  academic_workload: number;
  deadline_pressure: number;
  study_hours: number;
  mood: number;
  energy: number;
  physical_activity: number;
  social_connectedness: number;
  financial_concern: number;
  self_reported_stress: number;
  note?: string;
}

export interface Checkin extends CheckinPayload {
  id: number;
  user_id: number;
  safety_flag: boolean;
  created_at: string;
}

export interface StressFactor {
  key: string;
  label: string;
  contribution: number;
}

export interface StressResult {
  score: number;
  level: "low" | "moderate" | "high";
  factors: StressFactor[];
  engine_version: string;
  explanation?: string;
}

export interface Recommendation {
  id: number;
  category: string;
  title: string;
  description: string;
  rule_key: string;
  estimated_minutes: number;
  active: boolean;
  recommendation_status: string;
  created_at: string;
  completed_at: string | null;
}

/** Shape returned inline from POST /api/checkins (generated, not yet persisted as DB rows) */
export interface InlineRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  reason: string;
  estimatedMinutes: number;
  priority: "low" | "normal" | "high";
  ruleKey: string;
  active: boolean;
}

export interface CheckinResponse {
  checkin: Checkin;
  stress: StressResult;
  recommendations: InlineRecommendation[];
}

export const checkinsApi = {
  submit: (data: CheckinPayload) =>
    request<CheckinResponse>("POST", "/checkins", data),

  list: () => request<Checkin[]>("GET", "/checkins"),
};

// ── Stress ────────────────────────────────────────────────────────────────────

export interface StressTrend {
  score: number;
  created_at: string;
}

export const stressApi = {
  latest: () => request<StressResult | null>("GET", "/stress/latest"),
  trends: () => request<StressTrend[]>("GET", "/stress/trends"),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  profile: Profile | null;
  recentCheckins: Checkin[];
  latestStress: StressResult | null;
  recommendations: Recommendation[];
}

export const dashboardApi = {
  get: () => request<DashboardData>("GET", "/dashboard"),
};

// ── Recommendations ───────────────────────────────────────────────────────────

export const recommendationsApi = {
  list: () => request<Recommendation[]>("GET", "/recommendations"),
  complete: (id: number) =>
    request<Recommendation>("POST", `/recommendations/${id}/complete`),
};

// ── Privacy ───────────────────────────────────────────────────────────────────

export const privacyApi = {
  export: () => request<unknown>("GET", "/privacy/export"),
  deleteAccount: () => request<{ ok: boolean }>("DELETE", "/account"),
};
