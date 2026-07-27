import type {
  Category,
  Goal,
  GoalRecord,
  Habit,
  HabitRecord,
  Milestone,
  MilestoneRecord,
} from "../types/storage";
import { calculateHabitStreak } from "./storageLogic";

export const DEFAULT_CATEGORY_TEMPLATES: Omit<Category, "id">[] = [
  { name: "Health", color: "#10b981", icon: "🏃" },
  { name: "Career", color: "#6366f1", icon: "💼" },
  { name: "Learning", color: "#f59e0b", icon: "📖" },
  { name: "Finance", color: "#0ea5e9", icon: "💰" },
  { name: "Creative", color: "#ec4899", icon: "🎨" },
  { name: "Personal", color: "#8b5cf6", icon: "🌱" },
  { name: "Other", color: "#64748b", icon: "⚡" },
];

export function mapGoalRecords(
  goalsData: GoalRecord[],
  milestonesData: MilestoneRecord[],
): Goal[] {
  const milestonesByGoalId = new Map<string, Milestone[]>();

  milestonesData.forEach((milestone) => {
    const goalMilestones = milestonesByGoalId.get(milestone.goal_id);
    const normalizedMilestone: Milestone = {
      ...milestone,
      completed_dates: milestone.completed_dates || [],
    };

    if (goalMilestones) {
      goalMilestones.push(normalizedMilestone);
      return;
    }

    milestonesByGoalId.set(milestone.goal_id, [normalizedMilestone]);
  });

  return goalsData.map((goal) => ({
    ...goal,
    completed_dates: goal.completed_dates || [],
    archived_at: goal.archived_at || null,
    archive_expires_at: goal.archive_expires_at || null,
    is_featured: goal.is_featured || false,
    milestones: milestonesByGoalId.get(goal.id) || [],
  }));
}

export function mapHabitRecords(habitsData: HabitRecord[]): Habit[] {
  return (habitsData || []).map((habit) => ({
    ...habit,
    completed_dates: habit.completed_dates || [],
    streak: calculateHabitStreak({
      ...habit,
      completed_dates: habit.completed_dates || [],
    }),
    archived_at: habit.archived_at || null,
    archive_expires_at: habit.archive_expires_at || null,
  }));
}
