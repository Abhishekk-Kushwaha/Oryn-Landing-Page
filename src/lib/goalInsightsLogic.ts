import { isValid, parseISO, startOfDay } from "date-fns";
import type { Category, Goal, Milestone } from "../storage";

export function safeDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function formatDelta(value: number) {
  if (value > 0) return `+${Math.round(value)}%`;
  if (value < 0) return `${Math.round(value)}%`;
  return "0%";
}

export function getAccentColor(goal: Goal, fallback: string) {
  if (goal.color) return goal.color;
  const category = (goal.category || "").toLowerCase();
  if (category.includes("health")) return "#7ce5bd";
  if (category.includes("finance")) return "#f5b955";
  if (category.includes("learn")) return "#f4b560";
  if (goal.priority === "High") return "#67b8ff";
  return fallback;
}

export function getTotalOccurrences(item: {
  created_at?: string;
  repeat?: string;
  due_date?: string;
  deadline?: string;
}) {
  if (!item.repeat || item.repeat === "None") return 1;
  const start = safeDate(item.created_at) || startOfDay(new Date());
  const end = safeDate(item.due_date || item.deadline);
  if (!end) return 1;

  const dayDiff = Math.max(
    0,
    Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000),
  );
  if (item.repeat === "Daily") return Math.max(1, dayDiff + 1);
  if (item.repeat === "Weekly") return Math.max(1, Math.ceil((dayDiff + 1) / 7));
  if (item.repeat === "Monthly") return Math.max(1, Math.ceil((dayDiff + 1) / 30));
  return 1;
}

function truncateGoalInsightsLabel(title: string) {
  if (title.length <= 7) return title;
  return `${title.slice(0, 7).trimEnd()}...`;
}

export type GoalInsightsChartItem = {
  id: string;
  title: string;
  fullTitle: string;
  shortLabel: string;
  progress: number;
  color: string;
};

export type GoalInsightsRadarDatum = {
  fullTitle: string;
  shortLabel: string;
  progress: number;
  color: string;
};

export type GoalInsightsLegendItem = {
  id: string;
  title: string;
  progress: number;
  color: string;
};

export type GoalInsightsRadialBarDatum = {
  id: string;
  title: string;
  progress: number;
  fill: string;
};

export type GoalInsightsChartsModel = {
  isEmpty: boolean;
  displayGoals: GoalInsightsChartItem[];
  radarData: GoalInsightsRadarDatum[];
  legendItems: GoalInsightsLegendItem[];
  radialChartData: GoalInsightsRadialBarDatum[];
};

export function buildGoalInsightsChartsModel(
  goals: Goal[],
  categories: Category[],
): GoalInsightsChartsModel {
  const displayGoals = goals
    .map((goal) => ({
      goal,
      progress: clamp(Math.round(goal.progress || 0), 0, 100),
    }))
    .filter(({ goal, progress }) => goal.title !== "General Tasks" && progress < 100)
    .sort((a, b) => b.progress - a.progress || a.goal.title.localeCompare(b.goal.title))
    .slice(0, 5)
    .map(({ goal, progress }) => ({
      id: goal.id,
      title: goal.title,
      fullTitle: goal.title,
      shortLabel: truncateGoalInsightsLabel(goal.title),
      progress,
      color: getAccentColor(
        goal,
        categories.find((category) => category.name === goal.category)?.color || "#67b8ff",
      ),
    }));

  return {
    isEmpty: displayGoals.length === 0,
    displayGoals,
    radarData: displayGoals.map((goal) => ({
      fullTitle: goal.fullTitle,
      shortLabel: goal.shortLabel,
      progress: goal.progress,
      color: goal.color,
    })),
    legendItems: displayGoals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      progress: goal.progress,
      color: goal.color,
    })),
    radialChartData: [...displayGoals].reverse().map((goal) => ({
      id: goal.id,
      title: goal.title,
      progress: goal.progress,
      fill: goal.color,
    })),
  };
}

export type GoalActivityEvent = { date: Date; value: number };

export function buildActivityEvents(goal: Goal) {
  const events: GoalActivityEvent[] = [];
  const milestones = goal.milestones || [];
  const milestoneCount = milestones.length;
  const milestoneShare = milestoneCount > 0 ? 100 / milestoneCount : 0;

  if (milestoneCount > 0) {
    milestones.forEach((milestone: Milestone) => {
      if (milestone.repeat && milestone.repeat !== "None") {
        const totalOccurrences = getTotalOccurrences({
          created_at: milestone.created_at,
          repeat: milestone.repeat,
          due_date: milestone.due_date,
        });
        const completionWeight = milestoneShare / Math.max(1, totalOccurrences);
        (milestone.completed_dates || []).forEach((dateStr: string) => {
          const date = safeDate(dateStr);
          if (date) events.push({ date: startOfDay(date), value: completionWeight });
        });
        return;
      }

      if (milestone.done || milestone.completed_at) {
        const date =
          safeDate(milestone.completed_at) ||
          safeDate(milestone.due_date) ||
          safeDate(goal.created_at) ||
          startOfDay(new Date());
        events.push({ date: startOfDay(date), value: milestoneShare });
      }
    });
    return events;
  }

  if (goal.repeat && goal.repeat !== "None" && (goal.completed_dates || []).length > 0) {
    const totalOccurrences = getTotalOccurrences({
      created_at: goal.created_at,
      repeat: goal.repeat,
      deadline: goal.deadline,
    });
    const completionWeight = 100 / Math.max(1, totalOccurrences);
    (goal.completed_dates || []).forEach((dateStr: string) => {
      const date = safeDate(dateStr);
      if (date) events.push({ date: startOfDay(date), value: completionWeight });
    });
  }

  return events;
}
