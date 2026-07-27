import { differenceInCalendarDays, isValid, parseISO, startOfDay } from "date-fns";

export const GOAL_DEADLINE_SOON_DAYS = 7;

export function parseLocalDateValue(dateStr?: string | null) {
  if (!dateStr) return null;

  const parsed = parseISO(dateStr);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

function formatGoalDueText(daysLeft: number | null) {
  if (daysLeft === null) return "No deadline";
  if (daysLeft < 0) {
    return `Due ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago`;
  }
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "Due tomorrow";
  return `Due in ${daysLeft} days`;
}

function formatGoalCompactDueText(daysLeft: number | null, isCompleted: boolean) {
  if (isCompleted) return "Completed";
  if (daysLeft === null) return "On track";
  if (daysLeft < 0) {
    return `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} overdue`;
  }
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "Due tomorrow";
  if (daysLeft <= GOAL_DEADLINE_SOON_DAYS) return `Due in ${daysLeft} days`;
  return `Due ${daysLeft}d`;
}

type GoalDeadlineMetaInput = {
  deadline?: string | null;
  progress?: number | null;
  now?: Date;
};

export function getGoalDeadlineMeta({
  deadline,
  progress = 0,
  now = new Date(),
}: GoalDeadlineMetaInput) {
  const deadlineDate = parseLocalDateValue(deadline);
  const isCompleted = (progress || 0) >= 100;

  if (!deadlineDate) {
    return {
      deadlineDate: null,
      daysLeft: null as number | null,
      isCompleted,
      isOverdue: false,
      isDueSoon: false,
      isDueToday: false,
      isDueTomorrow: false,
      needsAttention: false,
      dueText: isCompleted ? "Completed" : "No deadline",
      compactDueText: isCompleted ? "Completed" : "On track",
    };
  }

  const daysLeft = differenceInCalendarDays(deadlineDate, startOfDay(now));
  const isOverdue = !isCompleted && daysLeft < 0;
  const isDueToday = !isCompleted && daysLeft === 0;
  const isDueTomorrow = !isCompleted && daysLeft === 1;
  const isDueSoon =
    !isCompleted &&
    daysLeft >= 0 &&
    daysLeft <= GOAL_DEADLINE_SOON_DAYS;

  return {
    deadlineDate,
    daysLeft,
    isCompleted,
    isOverdue,
    isDueSoon,
    isDueToday,
    isDueTomorrow,
    needsAttention: isOverdue || isDueSoon,
    dueText: isCompleted ? "Completed" : formatGoalDueText(daysLeft),
    compactDueText: formatGoalCompactDueText(daysLeft, isCompleted),
  };
}
