import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  isSameDay,
  isSameMonth,
  isSameWeek,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type {
  CompletableItem,
  DatedRepeatableItem,
  Goal,
  Habit,
} from "../types/storage";

const dateCache = new Map<string, Date>();

export function fastParseISO(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateCache.has(dateStr)) return dateCache.get(dateStr)!;

  const parsed = parseISO(dateStr);
  if (dateCache.size > 2000) dateCache.clear();
  dateCache.set(dateStr, parsed);
  return parsed;
}

export function isDueOnDate(item: DatedRepeatableItem, date: Date) {
  if (!item.repeat || item.repeat === "None") {
    const dueDate = item.due_date || item.deadline;
    if (dueDate) return isSameDay(fastParseISO(dueDate), date);
    return false;
  }

  const created = item.created_at ? fastParseISO(item.created_at) : new Date();
  if (item.created_at && startOfDay(date) < startOfDay(created)) return false;

  const dueDate = item.due_date || item.deadline;
  if (dueDate && startOfDay(date) > startOfDay(fastParseISO(dueDate))) {
    return false;
  }

  if (item.repeat === "Daily") return true;
  if (item.repeat === "Weekly") return date.getDay() === created.getDay();
  if (item.repeat === "Monthly") return date.getDate() === created.getDate();

  return false;
}

export function isCompletedOnDate(item: CompletableItem, date: Date) {
  if (!item.repeat || item.repeat === "None") {
    if (item.done) {
      if (item.completed_at) {
        return isSameDay(fastParseISO(item.completed_at), date);
      }

      const dueDate = item.due_date || item.deadline;
      if (dueDate) return isSameDay(fastParseISO(dueDate), date);
      if (item.created_at) return isSameDay(fastParseISO(item.created_at), date);
      return false;
    }

    return false;
  }

  if (!item.completed_dates) return false;

  return item.completed_dates.some((completedDate) => {
    const parsedDate = fastParseISO(completedDate);
    if (item.repeat === "Daily") return isSameDay(parsedDate, date);
    if (item.repeat === "Weekly") return isSameWeek(parsedDate, date);
    if (item.repeat === "Monthly") return isSameMonth(parsedDate, date);
    return false;
  });
}

export function setCompletedDateState(
  completedDates: string[] | undefined,
  repeat: string | undefined,
  targetDate: Date,
  done: boolean,
) {
  const currentDates = completedDates || [];
  const alreadyCompleted = isCompletedOnDate(
    { repeat, completed_dates: currentDates },
    targetDate,
  );

  if (done && !alreadyCompleted) {
    return [...currentDates, targetDate.toISOString()];
  }

  if (!done && alreadyCompleted) {
    return currentDates.filter((completedDate) => {
      const parsedDate = fastParseISO(completedDate);
      if (repeat === "Daily") return !isSameDay(parsedDate, targetDate);
      if (repeat === "Weekly") return !isSameWeek(parsedDate, targetDate);
      if (repeat === "Monthly") return !isSameMonth(parsedDate, targetDate);
      return true;
    });
  }

  return currentDates;
}

function addDaysToDate(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfDay(nextDate);
}

function getLatestHabitOccurrence(habit: Habit, today = new Date()) {
  if (!habit.created_at) return startOfDay(today);

  const anchor = startOfDay(fastParseISO(habit.created_at));
  let end = startOfDay(today);
  if (habit.due_date) {
    const dueDate = startOfDay(fastParseISO(habit.due_date));
    if (dueDate < end) end = dueDate;
  }
  if (end < anchor) return null;

  if (habit.repeat === "Daily") return end;

  if (habit.repeat === "Weekly") {
    const daysBack = (end.getDay() - anchor.getDay() + 7) % 7;
    const occurrence = addDaysToDate(end, -daysBack);
    return occurrence >= anchor ? occurrence : null;
  }

  if (habit.repeat === "Monthly") {
    const anchorDay = anchor.getDate();
    for (let i = 0; i <= 24; i++) {
      const month = end.getMonth() - i;
      const occurrence = startOfDay(new Date(end.getFullYear(), month, anchorDay));
      if (occurrence.getDate() !== anchorDay) continue;
      if (occurrence > end) continue;
      return occurrence >= anchor ? occurrence : null;
    }
  }

  return null;
}

function getPreviousHabitOccurrence(habit: Habit, occurrence: Date) {
  const anchor = habit.created_at ? startOfDay(fastParseISO(habit.created_at)) : null;
  let previous: Date | null = null;

  if (habit.repeat === "Daily") {
    previous = addDaysToDate(occurrence, -1);
  } else if (habit.repeat === "Weekly") {
    previous = addDaysToDate(occurrence, -7);
  } else if (habit.repeat === "Monthly") {
    const anchorDay = habit.created_at
      ? startOfDay(fastParseISO(habit.created_at)).getDate()
      : occurrence.getDate();
    for (let i = 1; i <= 24; i++) {
      const month = occurrence.getMonth() - i;
      const candidate = startOfDay(
        new Date(occurrence.getFullYear(), month, anchorDay),
      );
      if (candidate.getDate() === anchorDay && candidate < occurrence) {
        previous = candidate;
        break;
      }
    }
  }

  if (!previous) return null;
  if (anchor && previous < anchor) return null;
  return previous;
}

export function countTotalOccurrences(item: DatedRepeatableItem) {
  if (!item.repeat || item.repeat === "None") return 1;

  const start = item.created_at ? fastParseISO(item.created_at) : new Date();
  const endDate = item.due_date || item.deadline;
  if (!endDate) return 1;
  const end = fastParseISO(endDate);

  if (startOfDay(end) < startOfDay(start)) return 1;

  if (item.repeat === "Daily") {
    return Math.max(1, differenceInCalendarDays(end, start) + 1);
  }
  if (item.repeat === "Weekly") {
    return Math.max(1, differenceInCalendarWeeks(end, start) + 1);
  }
  if (item.repeat === "Monthly") {
    return Math.max(1, differenceInCalendarMonths(end, start) + 1);
  }

  return 1;
}

export function countCompletedOccurrences(
  item: Pick<CompletableItem, "repeat" | "completed_dates">,
) {
  if (!item.repeat || item.repeat === "None") return 0;
  if (!item.completed_dates) return 0;

  const uniquePeriods = new Set<number>();
  item.completed_dates.forEach((completedDate) => {
    const parsedDate = fastParseISO(completedDate);
    if (item.repeat === "Daily") {
      uniquePeriods.add(startOfDay(parsedDate).getTime());
    } else if (item.repeat === "Weekly") {
      uniquePeriods.add(startOfWeek(parsedDate).getTime());
    } else if (item.repeat === "Monthly") {
      uniquePeriods.add(startOfMonth(parsedDate).getTime());
    }
  });

  return uniquePeriods.size;
}

export function updateGoalProgressInPlace(goal: Goal) {
  if (!goal.milestones || goal.milestones.length === 0) {
    goal.progress = 0;
    return;
  }

  let totalProgress = 0;
  const milestoneShare = 100 / goal.milestones.length;

  goal.milestones.forEach((milestone) => {
    if (milestone.repeat && milestone.repeat !== "None") {
      const totalOccurrences = countTotalOccurrences(milestone);
      const completedOccurrences = countCompletedOccurrences(milestone);
      totalProgress +=
        (Math.min(completedOccurrences, totalOccurrences) / totalOccurrences) *
        milestoneShare;
    } else if (milestone.done) {
      totalProgress += milestoneShare;
    }
  });

  goal.progress = Math.min(100, Math.round(totalProgress));
}

export function calculateHabitStreak(habit: Habit): number {
  if (!habit.completed_dates || habit.completed_dates.length === 0) return 0;

  const today = startOfDay(new Date());
  let cursor = getLatestHabitOccurrence(habit, today);
  if (!cursor) return 0;

  if (!isCompletedOnDate(habit, cursor)) {
    if (!isSameDay(cursor, today)) return 0;
    cursor = getPreviousHabitOccurrence(habit, cursor);
  }

  let streak = 0;
  while (cursor && isCompletedOnDate(habit, cursor)) {
    streak++;
    cursor = getPreviousHabitOccurrence(habit, cursor);
  }

  return streak;
}
