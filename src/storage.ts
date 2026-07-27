import {
  calculateHabitStreak as calculateHabitStreakValue,
  isCompletedOnDate,
  isDueOnDate,
  setCompletedDateState,
  updateGoalProgressInPlace,
} from "./lib/storageLogic";
import {
  DEFAULT_CATEGORY_TEMPLATES as DEFAULT_CATEGORY_TEMPLATES_BASE,
  mapGoalRecords as mapGoalRecordsBase,
  mapHabitRecords as mapHabitRecordsBase,
} from "./lib/storageMappers";
import type {
  Category,
  Goal,
  GoalRecord,
  Habit,
  HabitRecord,
  Milestone,
  MilestoneRecord,
} from "./types/storage";

export type { Category, Goal, Habit, Milestone } from "./types/storage";
export { isCompletedOnDate, isDueOnDate } from "./lib/storageLogic";

import { getMockData } from "./lib/mockData";

interface LocalData {
  goals: GoalRecord[];
  milestones: MilestoneRecord[];
  habits: HabitRecord[];
  categories: Category[];
}

let inMemoryData: LocalData | null = null;

function getLocalData(): LocalData {
  if (!inMemoryData) {
    const mock = getMockData();
    // Pre-calculate initially
    mock.goals.forEach(goal => {
      const ms = mock.milestones.filter(m => m.goal_id === goal.id);
      const mapped = mapGoalRecordsBase([goal], ms)[0];
      updateGoalProgressInPlace(mapped);
      goal.progress = mapped.progress;
    });
    inMemoryData = mock;
  }
  return inMemoryData;
}

function saveLocalData(data: LocalData) {
  inMemoryData = data;
}

export const storage = {
  clearCache() {}, // No-op

  async getGoals(): Promise<Goal[]> {
    const data = getLocalData();
    const activeGoals = data.goals.filter(g => !g.archived_at);
    return mapGoalRecordsBase(activeGoals, data.milestones);
  },

  async getArchivedGoals(): Promise<Goal[]> {
    const data = getLocalData();
    const nowIso = new Date().toISOString();
    const archivedGoals = data.goals.filter(
      g => Boolean(g.archived_at) && Boolean(g.archive_expires_at) && g.archive_expires_at! > nowIso
    ).sort((a, b) => String(b.archived_at || "").localeCompare(String(a.archived_at || "")));
    return mapGoalRecordsBase(archivedGoals, data.milestones);
  },

  async getArchivedGoalHistory(): Promise<Goal[]> {
    const data = getLocalData();
    const history = data.goals.filter(
      g => Boolean(g.archived_at)
    ).sort((a, b) => String(b.archived_at || "").localeCompare(String(a.archived_at || "")));
    return mapGoalRecordsBase(history, data.milestones);
  },

  async addGoal(goal: Goal) {
    const data = getLocalData();
    const baseGoal: GoalRecord = {
      id: goal.id,
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      deadline: goal.deadline || null,
      note: goal.note,
      progress: 0,
      streak: 0,
      repeat: goal.repeat || 'None',
      completed_dates: [],
      is_featured: goal.is_featured || false,
      created_at: new Date().toISOString(),
      color: goal.color || null,
    };
    data.goals.push(baseGoal);
    saveLocalData(data);
  },

  async setFeaturedGoal(id: string | null) {
    const data = getLocalData();
    data.goals = data.goals.map(g => ({
      ...g,
      is_featured: id ? g.id === id : false,
    }));
    saveLocalData(data);
  },

  async updateGoal(id: string, updates: Partial<Goal>) {
    const data = getLocalData();
    data.goals = data.goals.map(g => {
      if (g.id === id) {
        const { milestones, ...goalUpdates } = updates;
        return { ...g, ...goalUpdates } as GoalRecord;
      }
      return g;
    });
    saveLocalData(data);
  },

  async deleteGoal(id: string) {
    const data = getLocalData();
    const archivedAt = new Date();
    const archiveExpiresAt = new Date(archivedAt);
    archiveExpiresAt.setDate(archiveExpiresAt.getDate() + 15);

    data.goals = data.goals.map(g => {
      if (g.id === id) {
        return {
          ...g,
          archived_at: archivedAt.toISOString(),
          archive_expires_at: archiveExpiresAt.toISOString()
        };
      }
      return g;
    });
    saveLocalData(data);
  },

  async restoreGoal(id: string) {
    const data = getLocalData();
    data.goals = data.goals.map(g => {
      if (g.id === id) {
        return {
          ...g,
          archived_at: null,
          archive_expires_at: null
        };
      }
      return g;
    });
    saveLocalData(data);
  },

  async addMilestone(milestone: Milestone): Promise<Goal | null> {
    const data = getLocalData();
    data.milestones.push({
      ...milestone,
      done: false,
      completed_dates: [],
      created_at: new Date().toISOString()
    });
    saveLocalData(data);
    return await this.recalculateGoalProgress(milestone.goal_id);
  },

  async setMilestoneCompleted(id: string, date: Date | undefined, done: boolean) {
    const data = getLocalData();
    const ms = data.milestones.find(m => m.id === id);
    if (!ms) return;
    
    if (ms.repeat && ms.repeat !== 'None') {
      const targetDate = date || new Date();
      ms.completed_dates = setCompletedDateState(
        ms.completed_dates || [],
        ms.repeat,
        targetDate,
        done,
      );
    } else {
      ms.done = done;
      ms.completed_at = done ? new Date().toISOString() : undefined;
    }
    saveLocalData(data);
    return await this.recalculateGoalProgress(ms.goal_id);
  },

  async toggleMilestone(id: string, date?: Date) {
    const data = getLocalData();
    const ms = data.milestones.find(m => m.id === id);
    if (!ms) return;

    const targetDate = date || new Date();
    const done =
      ms.repeat && ms.repeat !== 'None'
        ? !isCompletedOnDate(ms, targetDate)
        : !ms.done;

    return await this.setMilestoneCompleted(id, targetDate, done);
  },

  async setGoalCompleted(id: string, date: Date | undefined, done: boolean): Promise<Goal | null> {
    const data = getLocalData();
    const goal = data.goals.find(g => g.id === id);
    if (!goal) return null;

    if (goal.repeat && goal.repeat !== 'None') {
      const targetDate = date || new Date();
      goal.completed_dates = setCompletedDateState(
        goal.completed_dates || [],
        goal.repeat,
        targetDate,
        done,
      );
      saveLocalData(data);
      return await this.recalculateGoalProgress(id);
    }
    return null;
  },

  async toggleGoalCompletion(id: string, date?: Date): Promise<Goal | null> {
    const data = getLocalData();
    const goal = data.goals.find(g => g.id === id);
    if (!goal) return null;

    const targetDate = date || new Date();
    return await this.setGoalCompleted(
      id,
      targetDate,
      !isCompletedOnDate(goal, targetDate),
    );
  },

  async setMilestonesDone(ids: string[], done: boolean, date?: Date) {
    const data = getLocalData();
    const updatedGoalIds = new Set<string>();

    for (const ms of data.milestones) {
      if (ids.includes(ms.id)) {
        updatedGoalIds.add(ms.goal_id);
        if (ms.repeat && ms.repeat !== 'None') {
          const targetDate = date || new Date();
          ms.completed_dates = setCompletedDateState(
            ms.completed_dates || [],
            ms.repeat,
            targetDate,
            done,
          );
        } else {
          ms.done = done;
          ms.completed_at = done ? new Date().toISOString() : undefined;
        }
      }
    }

    saveLocalData(data);
    const updatedGoals = await Promise.all(Array.from(updatedGoalIds).map(id => this.recalculateGoalProgress(id)));
    return updatedGoals.filter(Boolean) as Goal[];
  },

  async deleteMilestone(id: string) {
    const data = getLocalData();
    const index = data.milestones.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    const goalId = data.milestones[index].goal_id;
    data.milestones.splice(index, 1);
    saveLocalData(data);
    
    return await this.recalculateGoalProgress(goalId);
  },

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Goal | null> {
    const data = getLocalData();
    const index = data.milestones.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    data.milestones[index] = { ...data.milestones[index], ...updates };
    saveLocalData(data);
    
    return await this.recalculateGoalProgress(data.milestones[index].goal_id);
  },

  async recalculateGoalProgress(goalId: string): Promise<Goal | null> {
    const data = getLocalData();
    const rawGoal = data.goals.find(g => g.id === goalId);
    if (!rawGoal) return null;
    
    const rawMilestones = data.milestones.filter(m => m.goal_id === goalId).sort((a,b) => (a.created_at || "").localeCompare(b.created_at || ""));
    const goal = mapGoalRecordsBase([rawGoal], rawMilestones)[0];
    
    updateGoalProgressInPlace(goal);
    rawGoal.progress = goal.progress; // also save back to record
    saveLocalData(data);
    
    return goal;
  },

  updateGoalProgress(goal: Goal) {
    updateGoalProgressInPlace(goal);
  },

  async getCategories(): Promise<Category[]> {
    const data = getLocalData();
    if (data.categories.length === 0) {
      data.categories = DEFAULT_CATEGORY_TEMPLATES_BASE.map(t => ({
        ...t,
        id: crypto.randomUUID(),
      }));
      saveLocalData(data);
    }
    return data.categories;
  },

  async addCategory(category: Category) {
    const data = getLocalData();
    data.categories.push(category);
    saveLocalData(data);
  },

  async updateCategory(id: string, name: string, color: string, icon: string) {
    const data = getLocalData();
    data.categories = data.categories.map(c => c.id === id ? { ...c, name, color, icon } : c);
    saveLocalData(data);
  },

  async deleteCategory(id: string) {
    const data = getLocalData();
    data.categories = data.categories.filter(c => c.id !== id);
    saveLocalData(data);
  },

  async getHabits(): Promise<Habit[]> {
    const data = getLocalData();
    const activeHabits = data.habits.filter(h => !h.archived_at);
    return mapHabitRecordsBase(activeHabits);
  },

  async getArchivedHabits(): Promise<Habit[]> {
    const data = getLocalData();
    const nowIso = new Date().toISOString();
    const archivedHabits = data.habits.filter(
      h => Boolean(h.archived_at) && Boolean(h.archive_expires_at) && h.archive_expires_at! > nowIso
    ).sort((a, b) => String(b.archived_at || "").localeCompare(String(a.archived_at || "")));
    return mapHabitRecordsBase(archivedHabits);
  },

  async getArchivedHabitHistory(): Promise<Habit[]> {
    const data = getLocalData();
    const history = data.habits.filter(
      h => Boolean(h.archived_at)
    ).sort((a, b) => String(b.archived_at || "").localeCompare(String(a.archived_at || "")));
    return mapHabitRecordsBase(history);
  },

  async addHabit(habit: Habit) {
    const data = getLocalData();
    data.habits.push({
      ...habit,
      completed_dates: [],
      streak: 0,
      created_at: habit.created_at || new Date().toISOString()
    });
    saveLocalData(data);
  },

  async updateHabit(id: string, updates: Partial<Habit>) {
    const data = getLocalData();
    data.habits = data.habits.map(h => {
      if (h.id === id) {
        return { ...h, ...updates } as HabitRecord;
      }
      return h;
    });
    saveLocalData(data);
  },

  async deleteHabit(id: string) {
    const data = getLocalData();
    const archivedAt = new Date();
    const archiveExpiresAt = new Date(archivedAt);
    archiveExpiresAt.setDate(archiveExpiresAt.getDate() + 15);

    data.habits = data.habits.map(h => {
      if (h.id === id) {
        return {
          ...h,
          archived_at: archivedAt.toISOString(),
          archive_expires_at: archiveExpiresAt.toISOString()
        };
      }
      return h;
    });
    saveLocalData(data);
  },

  async restoreHabit(id: string) {
    const data = getLocalData();
    data.habits = data.habits.map(h => {
      if (h.id === id) {
        return {
          ...h,
          archived_at: null,
          archive_expires_at: null
        };
      }
      return h;
    });
    saveLocalData(data);
  },

  async setHabitCompleted(id: string, date: Date | undefined, done: boolean): Promise<Habit | null> {
    const data = getLocalData();
    const habitIndex = data.habits.findIndex(h => h.id === id);
    if (habitIndex === -1) return null;

    const habit = data.habits[habitIndex];
    const targetDate = date || new Date();
    const completed_dates = setCompletedDateState(
      habit.completed_dates || [],
      habit.repeat,
      targetDate,
      done,
    );
    
    habit.completed_dates = completed_dates;
    habit.streak = this.calculateHabitStreak({ ...habit, completed_dates });
    
    saveLocalData(data);
    return mapHabitRecordsBase([habit])[0];
  },

  async toggleHabit(id: string, date?: Date): Promise<Habit | null> {
    const data = getLocalData();
    const habit = data.habits.find(h => h.id === id);
    if (!habit) return null;

    const targetDate = date || new Date();
    return await this.setHabitCompleted(
      id,
      targetDate,
      !isCompletedOnDate(habit, targetDate),
    );
  },

  calculateHabitStreak(habit: Habit): number {
    return calculateHabitStreakValue(habit);
  }
};
