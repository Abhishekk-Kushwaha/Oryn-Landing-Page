import { useRef, type Dispatch, type SetStateAction } from "react";
import { parseISO, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { storage, isCompletedOnDate, type Goal, type Habit } from "../storage";

interface UseAppInteractionsProps {
  setHabits: Dispatch<SetStateAction<Habit[]>>;
  setGoals: Dispatch<SetStateAction<Goal[]>>;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function setCompletedDates(
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
    return currentDates.filter((d: string) => {
      const dDate = parseISO(d);
      if (repeat === "Daily") return !isSameDay(dDate, targetDate);
      if (repeat === "Weekly") return !isSameWeek(dDate, targetDate);
      if (repeat === "Monthly") return !isSameMonth(dDate, targetDate);
      return true;
    });
  }

  return currentDates;
}

export function useAppInteractions({ setHabits, setGoals }: UseAppInteractionsProps) {
  const requestVersionsRef = useRef(new Map<string, number>());

  const nextRequestVersion = (key: string) => {
    const version = (requestVersionsRef.current.get(key) || 0) + 1;
    requestVersionsRef.current.set(key, version);
    return version;
  };

  const isLatestRequest = (key: string, version: number) => {
    return requestVersionsRef.current.get(key) === version;
  };

  const setHabitCompletedOptimistic = async (
    id: string,
    date: string | undefined,
    done: boolean,
  ) => {
    const targetDate = date ? parseISO(date) : new Date();
    const requestKey = `habit:${id}:${dateKey(targetDate)}`;
    const version = nextRequestVersion(requestKey);
    let previousHabits: Habit[] | null = null;

    setHabits((prev) => {
      previousHabits = prev;
      return prev.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              completed_dates: setCompletedDates(
                habit.completed_dates,
                habit.repeat,
                targetDate,
                done,
              ),
            }
          : habit,
      );
    });

    try {
      const updatedHabit = await storage.setHabitCompleted(id, targetDate, done);
      if (updatedHabit && isLatestRequest(requestKey, version)) {
        setHabits((prev) =>
          prev.map((habit) =>
            habit.id === updatedHabit.id ? updatedHabit : habit,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to set habit completion:", err);
      if (isLatestRequest(requestKey, version) && previousHabits) {
        setHabits(previousHabits);
      }
    }
  };

  const setGoalCompletionOptimistic = async (
    id: string,
    date: string | undefined,
    done: boolean,
  ) => {
    const targetDate = date ? parseISO(date) : new Date();
    const requestKey = `goal:${id}:${dateKey(targetDate)}`;
    const version = nextRequestVersion(requestKey);
    let previousGoals: Goal[] | null = null;

    setGoals((prev) => {
      previousGoals = prev;
      return prev.map((goal) => {
        if (goal.id !== id) return goal;

        const updatedGoal = {
          ...goal,
          completed_dates: setCompletedDates(
            goal.completed_dates,
            goal.repeat,
            targetDate,
            done,
          ),
        };
        storage.updateGoalProgress(updatedGoal);
        return updatedGoal;
      });
    });

    try {
      const updatedGoal = await storage.setGoalCompleted(id, targetDate, done);
      if (updatedGoal && isLatestRequest(requestKey, version)) {
        setGoals((prev) =>
          prev.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal)),
        );
      }
    } catch (err) {
      console.error("Failed to set goal completion:", err);
      if (isLatestRequest(requestKey, version) && previousGoals) {
        setGoals(previousGoals);
      }
    }
  };

  const toggleHabitOptimistic = async (id: string, date?: string) => {
    const targetDate = date ? parseISO(date) : new Date();
    let desiredDone = true;

    setHabits((prev) => {
      const habit = prev.find((item) => item.id === id);
      desiredDone = habit ? !isCompletedOnDate(habit, targetDate) : true;
      return prev;
    });

    await setHabitCompletedOptimistic(id, targetDate.toISOString(), desiredDone);
  };

  const toggleGoalCompletionOptimistic = async (id: string, date?: string) => {
    const targetDate = date ? parseISO(date) : new Date();
    let desiredDone = true;

    setGoals((prev) => {
      const goal = prev.find((item) => item.id === id);
      desiredDone = goal ? !isCompletedOnDate(goal, targetDate) : true;
      return prev;
    });

    await setGoalCompletionOptimistic(id, targetDate.toISOString(), desiredDone);
  };

  return {
    setHabitCompletedOptimistic,
    setGoalCompletionOptimistic,
    toggleHabitOptimistic,
    toggleGoalCompletionOptimistic,
  };
}
