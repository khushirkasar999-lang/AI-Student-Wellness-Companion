// Weights and thresholds mirror /config/stress.config.ts — kept local to
// respect the TypeScript rootDir boundary (src/).
const FACTOR_WEIGHTS = {
  selfReportedStress: 0.25,
  sleep: 0.15,
  academicWorkload: 0.15,
  deadlinePressure: 0.1,
  mood: 0.1,
  energy: 0.05,
  physicalActivity: 0.05,
  socialConnectedness: 0.05,
  financialConcern: 0.05,
  studyRestImbalance: 0.05,
};

const STRESS_THRESHOLDS = {
  lowMax: 29,
  moderateMax: 59,
  highMax: 100,
};

const ENGINE_VERSION = "rule-engine-v1.0";

export type StressLevel = "low" | "moderate" | "high";

export interface StressFactor {
  key: string;
  label: string;
  contribution: number; // 0–100 normalised contribution
}

export interface StressResult {
  score: number;
  level: StressLevel;
  factors: StressFactor[];
  engine_version: string;
}

/**
 * All inputs are 1–5 scales (or 0–12 for sleep_duration).
 * We normalise each to 0–1 (0 = best, 1 = worst) before weighting.
 */
function normalise(value: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * Compute the stress score for a check-in payload.
 *
 * Returns a StressResult with:
 *  - score     0–100 integer
 *  - level     "low" | "moderate" | "high"
 *  - factors   the dimensions that contributed most (above 0.5 normalised)
 *  - engine_version
 */
export function computeStressScore(payload: Record<string, any>): StressResult {
  // --- Normalise each dimension to 0–1 (higher = more stress) ---

  // Self-reported stress: 1 (none) → 5 (extreme)
  const selfReportedStress = normalise(payload.self_reported_stress ?? 3, 1, 5);

  // Sleep: longer sleep + better quality = less stress
  // duration: 8 h optimal → 0 h worst; clamp to [0,12]
  const sleepDuration = normalise(8 - Math.min(8, payload.sleep_duration ?? 6), 0, 8);
  // quality: 5 (great) → 1 (terrible); invert
  const sleepQuality = normalise(6 - (payload.sleep_quality ?? 3), 1, 5);
  const sleep = (sleepDuration + sleepQuality) / 2;

  // Academic workload: 1 (light) → 5 (crushing)
  const academicWorkload = normalise(payload.academic_workload ?? 3, 1, 5);

  // Deadline pressure: 1 (none) → 5 (critical)
  const deadlinePressure = normalise(payload.deadline_pressure ?? 3, 1, 5);

  // Mood: 5 (great) → 1 (terrible); invert
  const mood = normalise(6 - (payload.mood ?? 3), 1, 5);

  // Energy: 5 (full) → 1 (exhausted); invert
  const energy = normalise(6 - (payload.energy ?? 3), 1, 5);

  // Physical activity: 5 (very active) → 1 (sedentary); invert
  const physicalActivity = normalise(6 - (payload.physical_activity ?? 3), 1, 5);

  // Social connectedness: 5 (very connected) → 1 (isolated); invert
  const socialConnectedness = normalise(
    6 - (payload.social_connectedness ?? 3),
    1,
    5
  );

  // Financial concern: 1 (none) → 5 (severe)
  const financialConcern = normalise(payload.financial_concern ?? 3, 1, 5);

  // Study-rest imbalance: study_hours > 8 without proportional sleep
  const studyHours = Math.min(20, payload.study_hours ?? 4);
  const sleepHours = Math.min(12, payload.sleep_duration ?? 6);
  const studyRestImbalance = normalise(
    Math.max(0, studyHours / 8 - sleepHours / 8),
    0,
    1.5
  );

  // --- Weighted sum ---
  const rawScore =
    selfReportedStress * FACTOR_WEIGHTS.selfReportedStress +
    sleep * FACTOR_WEIGHTS.sleep +
    academicWorkload * FACTOR_WEIGHTS.academicWorkload +
    deadlinePressure * FACTOR_WEIGHTS.deadlinePressure +
    mood * FACTOR_WEIGHTS.mood +
    energy * FACTOR_WEIGHTS.energy +
    physicalActivity * FACTOR_WEIGHTS.physicalActivity +
    socialConnectedness * FACTOR_WEIGHTS.socialConnectedness +
    financialConcern * FACTOR_WEIGHTS.financialConcern +
    studyRestImbalance * FACTOR_WEIGHTS.studyRestImbalance;

  const score = Math.round(Math.min(100, Math.max(0, rawScore * 100)));

  // --- Level ---
  let level: StressLevel;
  if (score <= STRESS_THRESHOLDS.lowMax) level = "low";
  else if (score <= STRESS_THRESHOLDS.moderateMax) level = "moderate";
  else level = "high";

  // --- Contributing factors (normalised value > 0.5 means above mid-point) ---
  const dimensionMap: { key: string; label: string; value: number }[] = [
    { key: "self_reported_stress", label: "Self-reported stress", value: selfReportedStress },
    { key: "sleep", label: "Sleep quality / duration", value: sleep },
    { key: "academic_workload", label: "Academic workload", value: academicWorkload },
    { key: "deadline_pressure", label: "Deadline pressure", value: deadlinePressure },
    { key: "mood", label: "Mood", value: mood },
    { key: "energy", label: "Energy level", value: energy },
    { key: "physical_activity", label: "Physical activity", value: physicalActivity },
    { key: "social_connectedness", label: "Social connectedness", value: socialConnectedness },
    { key: "financial_concern", label: "Financial concern", value: financialConcern },
    { key: "study_rest_imbalance", label: "Study/rest imbalance", value: studyRestImbalance },
  ];

  const factors: StressFactor[] = dimensionMap
    .filter((d) => d.value > 0.45)
    .sort((a, b) => b.value - a.value)
    .map((d) => ({
      key: d.key,
      label: d.label,
      contribution: Math.round(d.value * 100),
    }));

  return { score, level, factors, engine_version: ENGINE_VERSION };
}

/**
 * Build a short human-readable explanation of the stress result.
 */
export function buildStressExplanation(result: StressResult): string {
  const { score, level, factors } = result;

  const levelText =
    level === "low"
      ? "Your stress level is low — things look manageable right now."
      : level === "moderate"
      ? "You are experiencing a moderate level of stress."
      : "Your stress level is high — please consider reaching out for support.";

  if (factors.length === 0) {
    return `${levelText} No single factor stands out as a major driver (score: ${score}/100).`;
  }

  const topFactors = factors
    .slice(0, 3)
    .map((f) => f.label.toLowerCase())
    .join(", ");

  return `${levelText} Score: ${score}/100. Main contributors: ${topFactors}.`;
}
