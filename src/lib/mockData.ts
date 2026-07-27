import { DEFAULT_CATEGORY_TEMPLATES } from "./storageMappers";
import type { Category, GoalRecord, HabitRecord, MilestoneRecord } from "../types/storage";

interface LocalData {
  goals: GoalRecord[];
  milestones: MilestoneRecord[];
  habits: HabitRecord[];
  categories: Category[];
}

function generateCompletedDates(daysCount: number, probability: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = daysCount; i >= 0; i--) {
    if (Math.random() < probability) {
      const d = new Date();
      d.setUTCFullYear(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
  }
  return Array.from(new Set(dates)).sort();
}

export function getMockData(): LocalData {
  const now = new Date();
  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(now.getMonth() + 1);

  const categories = DEFAULT_CATEGORY_TEMPLATES.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
  }));

  const goalId1 = crypto.randomUUID();
  const goalId2 = crypto.randomUUID();
  const goalId3 = crypto.randomUUID();

  const goals: GoalRecord[] = [
    {
      id: goalId1,
      title: "Launch MVP Project",
      category: "Work",
      priority: "High",
      deadline: oneMonthFromNow.toISOString(),
      note: "Complete the core features and launch to early users.",
      progress: 0,
      streak: 5,
      repeat: "None",
      completed_dates: generateCompletedDates(365, 0.2),
      is_featured: true,
      created_at: new Date(now.getTime() - 10000000000).toISOString(),
      color: "#f97316",
    },
    {
      id: goalId2,
      title: "Run a Half Marathon",
      category: "Health",
      priority: "Medium",
      deadline: new Date(now.getTime() + 5000000000).toISOString(),
      note: "Follow the 12-week training plan.",
      progress: 0,
      streak: 12,
      repeat: "None",
      completed_dates: generateCompletedDates(365, 0.4),
      is_featured: false,
      created_at: new Date(now.getTime() - 5000000000).toISOString(),
      color: "#22c55e",
    },
    {
      id: goalId3,
      title: "Read 12 Books",
      category: "Learning",
      priority: "Low",
      deadline: new Date(now.getFullYear(), 11, 31).toISOString(),
      note: "Read one book per month on technical and personal growth.",
      progress: 0,
      streak: 2,
      repeat: "None",
      completed_dates: generateCompletedDates(365, 0.15),
      is_featured: false,
      created_at: new Date(now.getTime() - 20000000000).toISOString(),
      color: "#3b82f6",
    },
  ];

  const milestones: MilestoneRecord[] = [
    // Goal 1 Milestones
    {
        id: crypto.randomUUID(),
        goal_id: goalId1,
        title: "Finish UI Design",
        done: true,
        completed_at: new Date(now.getTime() - 86400000 * 5).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId1,
        title: "Setup Database Schema",
        done: true,
        completed_at: new Date(now.getTime() - 86400000 * 2).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId1,
        title: "Implement Authentication",
        done: false,
        due_date: new Date(now.getTime() + 86400000 * 2).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId1,
        title: "Deploy to Production",
        done: false,
        due_date: new Date(now.getTime() + 86400000 * 10).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    // Goal 2 Milestones
    {
        id: crypto.randomUUID(),
        goal_id: goalId2,
        title: "Run 5k without stopping",
        done: true,
        completed_at: new Date(now.getTime() - 86400000 * 20).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 40).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId2,
        title: "Run 10k",
        done: true,
        completed_at: new Date(now.getTime() - 86400000 * 5).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 40).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId2,
        title: "Run 15k",
        done: false,
        due_date: new Date(now.getTime() + 86400000 * 10).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 40).toISOString(),
    },
    // Goal 3 Milestones
    {
        id: crypto.randomUUID(),
        goal_id: goalId3,
        title: "Read 'Clean Code'",
        done: true,
        completed_at: new Date(now.getTime() - 86400000 * 40).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 80).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId3,
        title: "Read 'Atomic Habits'",
        done: true,
        completed_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
        created_at: new Date(now.getTime() - 86400000 * 80).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId3,
        title: "Read 'Deep Work'",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 80).toISOString(),
    },
    // New Unassigned Milestones for Goal 1 (Launch MVP Project)
    {
        id: crypto.randomUUID(),
        goal_id: goalId1,
        title: "Write API Documentation",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId1,
        title: "Create Landing Page Content",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId1,
        title: "Perform User Testing",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
    // New Unassigned Milestones for Goal 2 (Run a Half Marathon)
    {
        id: crypto.randomUUID(),
        goal_id: goalId2,
        title: "Buy new running shoes",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId2,
        title: "Plan race day nutrition",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId2,
        title: "Run 18k long run",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    // New Unassigned Milestones for Goal 3 (Read 12 Books)
    {
        id: crypto.randomUUID(),
        goal_id: goalId3,
        title: "Read 'Designing Data-Intensive Applications'",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 15).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId3,
        title: "Read 'Thinking, Fast and Slow'",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 15).toISOString(),
    },
    {
        id: crypto.randomUUID(),
        goal_id: goalId3,
        title: "Read 'The Pragmatic Programmer'",
        done: false,
        created_at: new Date(now.getTime() - 86400000 * 15).toISOString(),
    }
  ];

  const habits: HabitRecord[] = [
    {
        id: crypto.randomUUID(),
        title: "Morning Meditation",
        category: "Health",
        repeat: "Daily",
        created_at: new Date(now.getTime() - 86400000 * 365).toISOString(),
        completed_dates: generateCompletedDates(365, 0.8),
        streak: 24,
    },
    {
        id: crypto.randomUUID(),
        title: "Drink 2L Water",
        category: "Health",
        repeat: "Daily",
        created_at: new Date(now.getTime() - 86400000 * 365).toISOString(),
        completed_dates: generateCompletedDates(365, 0.9),
        streak: 41,
    },
    {
        id: crypto.randomUUID(),
        title: "Write Journal",
        category: "Personal",
        repeat: "Daily",
        created_at: new Date(now.getTime() - 86400000 * 100).toISOString(),
        completed_dates: generateCompletedDates(100, 0.6),
        streak: 3,
    },
    {
        id: crypto.randomUUID(),
        title: "Review Finances",
        category: "Work",
        repeat: "Weekly",
        created_at: new Date(now.getTime() - 86400000 * 365).toISOString(),
        completed_dates: generateCompletedDates(365, 0.15),
        streak: 2,
    }
  ];

  return { goals, milestones, habits, categories };
}
