import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGoalInsightsChartsModel,
  getAccentColor,
} from "../src/lib/goalInsightsLogic";
import type { Category, Goal } from "../src/types/storage";

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: overrides.id || "goal-id",
    title: overrides.title || "Goal",
    category: overrides.category || "Health",
    priority: overrides.priority || "Medium",
    progress: overrides.progress ?? 0,
    streak: overrides.streak ?? 0,
    milestones: overrides.milestones || [],
    ...overrides,
  };
}

const categories: Category[] = [
  { id: "health", name: "Health", color: "#10b981", icon: "H" },
  { id: "learning", name: "Learning", color: "#f59e0b", icon: "L" },
  { id: "career", name: "Career", color: "#6366f1", icon: "C" },
  { id: "other", name: "Other", color: "#64748b", icon: "O" },
];

test("getAccentColor prefers a custom goal color", () => {
  const goal = makeGoal({ color: "#123456", category: "Health", priority: "High" });

  assert.equal(getAccentColor(goal, "#abcdef"), "#123456");
});

test("buildGoalInsightsChartsModel filters completed goals and General Tasks", () => {
  const model = buildGoalInsightsChartsModel(
    [
      makeGoal({ id: "g1", title: "General Tasks", progress: 40 }),
      makeGoal({ id: "g2", title: "Finished", progress: 100 }),
      makeGoal({ id: "g3", title: "Overdone", progress: 120 }),
      makeGoal({ id: "g4", title: "Active Goal", progress: 62 }),
    ],
    categories,
  );

  assert.equal(model.isEmpty, false);
  assert.deepEqual(
    model.displayGoals.map((goal) => goal.title),
    ["Active Goal"],
  );
  assert.deepEqual(
    model.radarData.map((goal) => goal.progress),
    [62],
  );
});

test("buildGoalInsightsChartsModel clamps progress, sorts descending, and breaks ties alphabetically", () => {
  const model = buildGoalInsightsChartsModel(
    [
      makeGoal({ id: "g1", title: "Beta", progress: 40.4 }),
      makeGoal({ id: "g2", title: "Alpha", progress: 40.4 }),
      makeGoal({ id: "g3", title: "Gamma", progress: -12 }),
      makeGoal({ id: "g4", title: "Peak", progress: 89.6 }),
    ],
    categories,
  );

  assert.deepEqual(
    model.displayGoals.map((goal) => ({
      title: goal.title,
      progress: goal.progress,
      shortLabel: goal.shortLabel,
    })),
    [
      { title: "Peak", progress: 90, shortLabel: "Peak" },
      { title: "Alpha", progress: 40, shortLabel: "Alpha" },
      { title: "Beta", progress: 40, shortLabel: "Beta" },
      { title: "Gamma", progress: 0, shortLabel: "Gamma" },
    ],
  );
});

test("buildGoalInsightsChartsModel caps to five goals and uses resolved goal accents", () => {
  const model = buildGoalInsightsChartsModel(
    [
      makeGoal({ id: "g1", title: "Goal 1", progress: 10, category: "Other" }),
      makeGoal({ id: "g2", title: "Goal 2", progress: 20, category: "Career" }),
      makeGoal({ id: "g3", title: "Goal 3", progress: 30, category: "Learning" }),
      makeGoal({ id: "g4", title: "Goal 4", progress: 40, category: "Other", color: "#ff00aa" }),
      makeGoal({ id: "g5", title: "Goal 5", progress: 50, category: "Health" }),
      makeGoal({ id: "g6", title: "Goal 6", progress: 60, category: "Career" }),
    ],
    categories,
  );

  assert.deepEqual(
    model.legendItems.map((item) => ({
      title: item.title,
      progress: item.progress,
      color: item.color,
    })),
    [
      { title: "Goal 6", progress: 60, color: "#6366f1" },
      { title: "Goal 5", progress: 50, color: "#7ce5bd" },
      { title: "Goal 4", progress: 40, color: "#ff00aa" },
      { title: "Goal 3", progress: 30, color: "#f4b560" },
      { title: "Goal 2", progress: 20, color: "#6366f1" },
    ],
  );
  assert.deepEqual(
    model.radialChartData.map((item) => item.title),
    ["Goal 2", "Goal 3", "Goal 4", "Goal 5", "Goal 6"],
  );
});

test("buildGoalInsightsChartsModel returns empty state when no incomplete goals remain", () => {
  const model = buildGoalInsightsChartsModel(
    [
      makeGoal({ id: "g1", title: "Done", progress: 100 }),
      makeGoal({ id: "g2", title: "General Tasks", progress: 25 }),
    ],
    categories,
  );

  assert.equal(model.isEmpty, true);
  assert.deepEqual(model.displayGoals, []);
  assert.deepEqual(model.radarData, []);
  assert.deepEqual(model.legendItems, []);
  assert.deepEqual(model.radialChartData, []);
});
