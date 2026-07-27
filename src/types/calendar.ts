import type { Category, Goal, Habit, Milestone } from "./storage";

export type CalendarGoalItem = Goal & {
  goalTitle: string;
  categoryColor: string;
  goalId: string;
  isGoalAsMilestone: true;
  isHabit?: false;
  archived_at?: string | null;
};

export type CalendarMilestoneItem = Milestone & {
  goalTitle: string;
  categoryColor: string;
  goalId: string;
  isGoalAsMilestone: false;
  isHabit?: false;
  archived_at?: string | null;
};

export type CalendarHabitItem = Habit & {
  goalTitle: "Habit";
  categoryColor: string;
  isHabit: true;
  isGoalAsMilestone?: false;
  archived_at?: string | null;
};

export type CalendarItem =
  | CalendarGoalItem
  | CalendarMilestoneItem
  | CalendarHabitItem;

export type CalendarItemWithState = CalendarItem & {
  done?: boolean;
  completed_at?: string;
  category?: string;
  streak?: number;
};

export type UnassignedCalendarMilestone = Milestone & {
  goalTitle: string;
};

export type CalendarCategoryFallback = Pick<Category, "color">;
