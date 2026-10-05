type RecommendationRule = {
  ruleKey: string;
  category: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: "low" | "normal" | "high";
  when: (stress: Record<string, any>, profile: Record<string, any>) => boolean;
};

const rules: RecommendationRule[] = [
  {
    ruleKey: "sleep-risk",
    category: "Sleep",
    title: "Create a consistent sleep schedule",
    description: "Set a fixed bedtime and wake-up time to reduce sleep stress.",
    estimatedMinutes: 10,
    priority: "high",
    when: (stress) => stress.factors.some((factor: any) => factor.key === "sleep"),
  },
  {
    ruleKey: "academic-overload",
    category: "Study Planning",
    title: "Break your workload into 3 tasks",
    description: "Prioritize the three most important tasks before starting larger assignments.",
    estimatedMinutes: 15,
    priority: "normal",
    when: (stress) => stress.factors.some((factor: any) => factor.key === "academic_workload"),
  },
  {
    ruleKey: "deadline-pressure",
    category: "Time Management",
    title: "Create a deadline plan",
    description: "List deadlines and divide work into smaller milestones.",
    estimatedMinutes: 20,
    priority: "high",
    when: (stress) => stress.factors.some((factor: any) => factor.key === "deadline_pressure"),
  },
  {
    ruleKey: "activity-low",
    category: "Physical Activity",
    title: "Take a 10-minute walk",
    description: "Short movement breaks can improve energy and reduce stress.",
    estimatedMinutes: 10,
    priority: "normal",
    when: (stress) => stress.factors.some((factor: any) => factor.key === "physical_activity"),
  },
  {
    ruleKey: "social-low",
    category: "Social Connection",
    title: "Reach out to a trusted person",
    description: "A short check-in with someone you trust can reduce isolation.",
    estimatedMinutes: 15,
    priority: "normal",
    when: (stress) => stress.factors.some((factor: any) => factor.key === "social_connectedness"),
  },
  {
    ruleKey: "support-strong-risk",
    category: "Professional Support",
    title: "Talk with a campus support resource",
    description: "If stress remains high, connecting with a qualified support person may help.",
    estimatedMinutes: 20,
    priority: "high",
    when: (stress) => stress.score >= 70,
  },
];

export const generateRecommendations = (stress: Record<string, any>, profile: Record<string, any> = {}, existing: Record<string, any>[] = []) => {
  const selected = rules
    .filter((rule) => rule.when(stress, profile))
    .map((rule) => ({
      id: `${rule.ruleKey}-${Date.now()}`,
      title: rule.title,
      description: rule.description,
      category: rule.category,
      reason: `Stress suggests ${rule.category.toLowerCase()} needs attention.`,
      estimatedMinutes: rule.estimatedMinutes,
      priority: rule.priority,
      ruleKey: rule.ruleKey,
      active: true,
    }))
    .filter((item) => !existing.some((entry) => entry.ruleKey === item.ruleKey));

  return selected.slice(0, 5);
};
