import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateHabitStreak,
  countCompletedOccurrences,
  countTotalOccurrences,
  isCompletedOnDate,
  isDueOnDate,
  setCompletedDateState,
  updateGoalProgressInPlace,
} from "../src/lib/storageLogic";
import type { Goal, Habit, Milestone } from "../src/types/storage";

function isoDate(value: Date) {
  return value.toISOString();
}

function dayAt(offsetFromToday: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetFromToday);
  return date;
}

test("isDueOnDate handles one-time and recurring due logic", () => {
  const target = new Date("2026-05-15T00:00:00.000Z");
  const other = new Date("2026-05-16T00:00:00.000Z");

  assert.equal(
    isDueOnDate({ repeat: "None", due_date: "2026-05-15T00:00:00.000Z" }, target),
    true,
  );
  assert.equal(
    isDueOnDate({ repeat: "None", due_date: "2026-05-15T00:00:00.000Z" }, other),
    false,
  );

  assert.equal(
    isDueOnDate(
      {
        repeat: "Daily",
        created_at: "2026-05-10T00:00:00.000Z",
        due_date: "2026-05-20T00:00:00.000Z",
      },
      target,
    ),
    true,
  );
  assert.equal(
    isDueOnDate(
      {
        repeat: "Daily",
        created_at: "2026-05-10T00:00:00.000Z",
        due_date: "2026-05-14T00:00:00.000Z",
      },
      target,
    ),
    false,
  );
});

test("isCompletedOnDate matches daily recurring completion by day", () => {
  const target = new Date("2026-05-15T00:00:00.000Z");
  const item = {
    repeat: "Daily",
    completed_dates: ["2026-05-15T06:12:00.000Z"],
  };

  assert.equal(isCompletedOnDate(item, target), true);
  assert.equal(
    isCompletedOnDate(item, new Date("2026-05-16T00:00:00.000Z")),
    false,
  );
});

test("setCompletedDateState adds and removes recurring completion dates", () => {
  const target = new Date("2026-05-15T00:00:00.000Z");

  const added = setCompletedDateState([], "Daily", target, true);
  assert.equal(added.length, 1);
  assert.equal(
    isCompletedOnDate({ repeat: "Daily", completed_dates: added }, target),
    true,
  );

  const removed = setCompletedDateState(added, "Daily", target, false);
  assert.deepEqual(removed, []);
});

test("countTotalOccurrences and countCompletedOccurrences use recurrence periods", () => {
  const milestone: Milestone = {
    id: "m1",
    goal_id: "g1",
    title: "Recurring",
    done: false,
    repeat: "Daily",
    created_at: "2026-05-10T00:00:00.000Z",
    due_date: "2026-05-12T00:00:00.000Z",
    completed_dates: [
      "2026-05-10T01:00:00.000Z",
      "2026-05-10T05:00:00.000Z",
      "2026-05-12T02:00:00.000Z",
    ],
  };

  assert.equal(countTotalOccurrences(milestone), 3);
  assert.equal(countCompletedOccurrences(milestone), 2);
});

test("updateGoalProgressInPlace preserves existing progress formula", () => {
  const recurringMilestone: Milestone = {
    id: "m2",
    goal_id: "g1",
    title: "Recurring",
    done: false,
    repeat: "Daily",
    created_at: "2026-05-10T00:00:00.000Z",
    due_date: "2026-05-11T00:00:00.000Z",
    completed_dates: ["2026-05-10T02:00:00.000Z"],
  };

  const oneTimeMilestone: Milestone = {
    id: "m3",
    goal_id: "g1",
    title: "One-time",
    done: true,
  };

  const goal: Goal = {
    id: "g1",
    title: "Goal",
    category: "Health",
    priority: "Medium",
    progress: 0,
    streak: 0,
    milestones: [recurringMilestone, oneTimeMilestone],
  };

  updateGoalProgressInPlace(goal);
  assert.equal(goal.progress, 75);
});

test("calculateHabitStreak keeps counting backward by recurrence", () => {
  const today = dayAt(0);
  const yesterday = dayAt(-1);
  const twoDaysAgo = dayAt(-2);

  const habit: Habit = {
    id: "h1",
    title: "Read",
    category: "Learning",
    repeat: "Daily",
    created_at: isoDate(dayAt(-10)),
    completed_dates: [isoDate(today), isoDate(yesterday), isoDate(twoDaysAgo)],
    streak: 0,
  };

  assert.equal(calculateHabitStreak(habit), 3);
});
