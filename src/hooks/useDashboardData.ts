import { useMemo } from "react";
import { type Category, type Goal } from "../storage";

export function useDashboardData({
  goals,
  categories,
  activeGoalId,
}: {
  goals: Goal[];
  categories: Category[];
  activeGoalId: string | null;
}) {
  const activeGoal = useMemo(
    () => goals.find((g) => g.id === activeGoalId),
    [goals, activeGoalId],
  );

  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.progress === 100).length;
    const avgProgress = total
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / total)
      : 0;
    const totalMilestones = goals.reduce(
      (acc, g) => acc + (g.milestones || []).length,
      0,
    );
    const completedMilestones = goals.reduce(
      (acc, g) =>
        acc +
        (g.milestones || []).filter((m) => m.done).length,
      0,
    );

    return {
      total,
      completed,
      avgProgress,
      totalMilestones,
      completedMilestones,
    };
  }, [goals]);

  const chartData = useMemo(() => {
    return goals
      .map((g) => ({
        name: g.title.length > 15 ? g.title.substring(0, 12) + "..." : g.title,
        progress: g.progress,
        color: (
          categories.find((c) => c.name === g.category) || { color: "#64748b" }
        ).color,
      }))
      .slice(0, 8);
  }, [goals, categories]);

  return {
    activeGoal,
    stats,
    chartData,
  };
}
