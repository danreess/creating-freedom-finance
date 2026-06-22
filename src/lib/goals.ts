export type GoalType = "savings" | "mortgage" | "emergency" | "investment";

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyContribution: number;
  createdAt: string;
}

const STORAGE_KEY = "finance_goals";

export function loadGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveGoals(goals: Goal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export function createGoal(partial: Omit<Goal, "id" | "createdAt">): Goal {
  return {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}

export function progressPercent(goal: Goal): number {
  if (goal.targetAmount === 0) return 0;
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

export function projectedMonthsRemaining(goal: Goal): number | null {
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) return 0;
  if (!goal.monthlyContribution || goal.monthlyContribution <= 0) return null;
  return Math.ceil(remaining / goal.monthlyContribution);
}

export function projectedCompletionDate(goal: Goal): Date | null {
  const months = projectedMonthsRemaining(goal);
  if (months === null) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isOnTrack(goal: Goal): boolean {
  const deadline = new Date(goal.deadline);
  const now = new Date();
  const monthsLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const projected = projectedMonthsRemaining(goal);
  if (projected === null) return false;
  return projected <= monthsLeft;
}

export const GOAL_TYPE_META: Record<GoalType, { label: string; color: string; emoji: string; description: string }> = {
  savings: { label: "Savings Target", color: "#10b981", emoji: "🏦", description: "Save a specific amount by a target date" },
  mortgage: { label: "Mortgage Payoff", color: "#6366f1", emoji: "🏠", description: "Pay off your mortgage ahead of schedule" },
  emergency: { label: "Emergency Fund", color: "#f59e0b", emoji: "🛡️", description: "Build 3–6 months of living expenses as a safety net" },
  investment: { label: "Investment Target", color: "#8b5cf6", emoji: "📈", description: "Invest a regular amount each month" },
};
