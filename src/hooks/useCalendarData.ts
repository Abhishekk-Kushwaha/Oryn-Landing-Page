import React, { useMemo, useState } from "react";
import {
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  parseISO,
  startOfDay,
} from "date-fns";
import { storage, isCompletedOnDate, isDueOnDate, type Category, type Goal, type Habit } from "../storage";
import type {
  CalendarCategoryFallback,
  CalendarItem,
  CalendarItemWithState,
  UnassignedCalendarMilestone,
} from "../types/calendar";

function buildCalendarItems(
  goals: Goal[],
  habits: Habit[],
  categories: Category[],
): CalendarItem[] {
  const items: CalendarItem[] = [];

  goals.forEach((g) => {
    const cat: CalendarCategoryFallback = categories.find((c) => c.name === g.category) || {
      color: "#64748b",
    };

    if (g.repeat && g.repeat !== "None") {
      items.push({
        ...g,
        goalTitle: g.title,
        categoryColor: g.color || cat.color,
        goalId: g.id,
        isGoalAsMilestone: true,
        archived_at: g.archived_at || null,
      });
    } else {
      (g.milestones || []).forEach((m) => {
        items.push({
          ...m,
          goalTitle: g.title,
          categoryColor: g.color || cat.color,
          goalId: g.id,
          isGoalAsMilestone: false,
          archived_at: g.archived_at || null,
        });
      });
    }
  });

  habits.forEach((h) => {
    const cat: CalendarCategoryFallback = categories.find((c) => c.name === h.category) || {
      color: "#64748b",
    };
    items.push({
      ...h,
      goalTitle: "Habit",
      categoryColor: h.color || cat.color,
      isHabit: true,
      archived_at: h.archived_at || null,
    });
  });

  return items;
}

function isAvailableOnDate(item: { archived_at?: string | null }, date: Date) {
  if (!item.archived_at) return true;
  return startOfDay(date) <= startOfDay(parseISO(item.archived_at));
}

export function useCalendarData({
  goals,
  archivedGoalHistory,
  habits,
  archivedHabitHistory,
  categories,
  setGoals,
}: {
  goals: Goal[];
  archivedGoalHistory: Goal[];
  habits: Habit[];
  archivedHabitHistory: Habit[];
  categories: Category[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeCalendarDragId, setActiveCalendarDragId] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const allCalendarItems = useMemo(() => {
    return buildCalendarItems(goals, habits, categories);
  }, [goals, habits, categories]);

  const historicalCalendarItems = useMemo(() => {
    return buildCalendarItems(
      [...goals, ...archivedGoalHistory],
      [...habits, ...archivedHabitHistory],
      categories,
    );
  }, [archivedGoalHistory, archivedHabitHistory, categories, goals, habits]);

  const getItemsForDateFromList = (items: CalendarItem[], date: Date): CalendarItemWithState[] => {
    return items
      .filter((item) => isAvailableOnDate(item, date))
      .filter((item) => isDueOnDate(item, date))
      .map((item) => ({
        ...item,
        done: isCompletedOnDate(item, date),
      }));
  };

  const getItemsForDate = (date: Date) => {
    return getItemsForDateFromList(allCalendarItems, date);
  };

  const getHistoricalItemsForDate = (date: Date) => {
    return getItemsForDateFromList(historicalCalendarItems, date);
  };

  const milestonesForSelectedDate = useMemo(() => {
    return getItemsForDate(selectedDate);
  }, [allCalendarItems, selectedDate]);

  const unassignedMilestones = useMemo<UnassignedCalendarMilestone[]>(() => {
    return goals.flatMap((g) =>
      (g.milestones || [])
        .filter((m) => !m.due_date && !m.done)
        .map((m) => ({ ...m, goalTitle: g.title })),
    );
  }, [goals]);

  const activeCalendarMilestone = useMemo(() => {
    if (!activeCalendarDragId) return null;
    return unassignedMilestones.find((m) => m.id === activeCalendarDragId);
  }, [activeCalendarDragId, unassignedMilestones]);

  const handleCalendarDragStart = (event: DragStartEvent) => {
    setActiveCalendarDragId(String(event.active.id));
  };

  const handleCalendarDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCalendarDragId(null);

    if (over && active.id) {
      const milestoneId = String(active.id);
      const targetDate = String(over.id);

      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          milestones: g.milestones?.map((m) =>
            m.id === milestoneId ? { ...m, due_date: targetDate } : m,
          ),
        })),
      );

      storage
        .updateMilestone(milestoneId, { due_date: targetDate })
        .then((updatedGoal) => {
          if (updatedGoal) {
            setGoals((prev) =>
              prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)),
            );
          }
        })
        .catch((err) => {
          console.error("Failed to update milestone:", err);
        });
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    activeCalendarDragId,
    sensors,
    allCalendarItems,
    getItemsForDate,
    getHistoricalItemsForDate,
    milestonesForSelectedDate,
    unassignedMilestones,
    activeCalendarMilestone,
    handleCalendarDragStart,
    handleCalendarDragEnd,
  };
}
