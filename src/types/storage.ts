export type RepeatRule = "Daily" | "Weekly" | "Monthly";
export type GoalRepeatRule = "None" | RepeatRule;
export type GoalPriority = "High" | "Medium" | "Low";

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: string;
  repeat: RepeatRule;
  due_date?: string | null;
  color?: string;
  created_at: string;
  completed_dates: string[];
  streak: number;
  archived_at?: string | null;
  archive_expires_at?: string | null;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  done: boolean;
  due_date?: string | null;
  note?: string;
  completed_at?: string;
  repeat?: GoalRepeatRule;
  completed_dates?: string[];
  created_at?: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  color?: string;
  priority: GoalPriority;
  deadline?: string | null;
  note?: string;
  progress: number;
  streak: number;
  milestones: Milestone[];
  created_at?: string;
  repeat?: GoalRepeatRule;
  completed_dates?: string[];
  archived_at?: string | null;
  archive_expires_at?: string | null;
  is_featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type DatedRepeatableItem = {
  created_at?: string;
  repeat?: string;
  due_date?: string;
  deadline?: string;
};

export type CompletableItem = DatedRepeatableItem & {
  completed_dates?: string[];
  done?: boolean;
  completed_at?: string;
};

export type GoalRecord = Omit<Goal, "milestones"> & {
  completed_dates?: string[] | null;
};

export type MilestoneRecord = Milestone & {
  completed_dates?: string[] | null;
};

export type HabitRecord = Habit & {
  completed_dates?: string[] | null;
};
