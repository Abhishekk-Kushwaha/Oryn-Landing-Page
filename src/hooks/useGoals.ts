import React, { useCallback, useEffect, useMemo, useState } from "react";
import { storage, type Category, type Goal } from "../storage";
import type { ViewType } from "./useAppRouter";
import {
  readBrandStorage,
  removeBrandStorage,
  writeBrandStorage,
} from "../lib/brand";

const uid = () => crypto.randomUUID();

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return null;
};

export type GoalFormState = {
  title: string;
  category: string;
  color: string;
  priority: "High" | "Medium" | "Low";
  deadline: string;
  note: string;
  repeat: "None" | "Daily" | "Weekly" | "Monthly";
};

type UseGoalsOptions = {
  categories: Category[];
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  confirmAction: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
  }) => Promise<boolean>;
};

const getDefaultGoalForm = (categories: Category[]): GoalFormState => ({
  title: "",
  category: categories[0]?.name || "Health",
  color: "",
  priority: "Medium",
  deadline: "",
  note: "",
  repeat: "None",
});

export function useGoals({ categories, setView, confirmAction }: UseGoalsOptions) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [archivedGoals, setArchivedGoals] = useState<Goal[]>([]);
  const [archivedGoalHistory, setArchivedGoalHistory] = useState<Goal[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(() => {
    return readBrandStorage("activeGoalId");
  });
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState<GoalFormState>(() =>
    getDefaultGoalForm(categories),
  );

  const defaultGoalForm = useMemo(
    () => getDefaultGoalForm(categories),
    [categories],
  );

  useEffect(() => {
    if (categories.length === 0) return;
    setNewGoal((prev) =>
      prev.category ? prev : { ...prev, category: categories[0].name },
    );
  }, [categories]);

  useEffect(() => {
    if (activeGoalId) {
      writeBrandStorage("activeGoalId", activeGoalId);
    } else {
      removeBrandStorage("activeGoalId");
    }
  }, [activeGoalId]);

  useEffect(() => {
    if (!isAddingGoal && !editingGoal) {
      setSaveError(null);
    }
  }, [isAddingGoal, editingGoal]);

  const resetGoalForm = useCallback(() => {
    setNewGoal(defaultGoalForm);
  }, [defaultGoalForm]);

  const fetchGoals = async () => {
    const goalsData = await storage.getGoals();
    setGoals(goalsData);
    return goalsData;
  };

  const fetchArchivedGoals = async () => {
    const archivedGoalsData = await storage.getArchivedGoals();
    setArchivedGoals(archivedGoalsData);
    return archivedGoalsData;
  };

  const fetchArchivedGoalHistory = async () => {
    const archivedGoalsData = await storage.getArchivedGoalHistory();
    setArchivedGoalHistory(archivedGoalsData);
    return archivedGoalsData;
  };

  const cancelGoalForm = useCallback(() => {
    setIsAddingGoal(false);
    setEditingGoal(null);
    setSaveError(null);
    resetGoalForm();
  }, [resetGoalForm]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setSaveError(null);
    const trimmedTitle = newGoal.title.trim();
    if (!trimmedTitle) {
      setSaveError("Goal title is required.");
      return;
    }

    const trimmedDeadline = newGoal.deadline.trim();
    const normalizedColor = newGoal.color.trim();
    const previousGoals = goals;
    const goalDraft = editingGoal
      ? {
          ...newGoal,
          title: trimmedTitle,
          color: normalizedColor || undefined,
          deadline: trimmedDeadline || undefined,
        }
      : {
          ...newGoal,
          title: trimmedTitle,
          color: normalizedColor || undefined,
          deadline: trimmedDeadline || undefined,
          repeat: "None" as const,
        };

    const optimisticGoal = editingGoal
      ? {
          ...editingGoal,
          ...goalDraft,
        }
      : {
          ...goalDraft,
          id: uid(),
          progress: 0,
          streak: 0,
          milestones: [],
          last_reset_at: new Date().toISOString(),
        };

    setGoals((prev) =>
      editingGoal
        ? prev.map((goal) =>
            goal.id === editingGoal.id
              ? ({ ...goal, ...goalDraft } as Goal)
              : goal,
          )
        : ([optimisticGoal as Goal, ...prev] as Goal[]),
    );

    setIsSaving(true);
    try {
      if (editingGoal) {
        await storage.updateGoal(editingGoal.id, goalDraft);
      } else {
        await storage.addGoal(optimisticGoal as Goal);
      }
      cancelGoalForm();

      void fetchGoals().catch((error) => {
        console.error("Failed to refresh goals after save:", error);
      });
    } catch (error) {
      console.error("Error in handleAddGoal:", error);
      setGoals(previousGoals);
      const errorMessage = getErrorMessage(error);
      setSaveError(
        errorMessage
          ? `Failed to save goal: ${errorMessage}`
          : "An unexpected error occurred while saving.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const shouldDelete = await confirmAction({
      title: "Delete Goal?",
      message:
        "This moves the goal to Profile archive for 15 days. Goal performance and milestone progress stay saved.",
      confirmLabel: "Delete",
    });
    if (!shouldDelete) return;

    const goalToArchive = goals.find((goal) => goal.id === id);
    if (activeGoalId === id) {
      setActiveGoalId(null);
      setView("goals");
    }
    setGoals((prev) => prev.filter((g) => g.id !== id));

    try {
      await storage.deleteGoal(id);
      if (editingGoal?.id === id) {
        cancelGoalForm();
      }
      await Promise.all([
        fetchGoals(),
        fetchArchivedGoals(),
        fetchArchivedGoalHistory(),
      ]);
    } catch (err) {
      console.error("Failed to delete goal:", err);
      if (goalToArchive) {
        setGoals((prev) => [goalToArchive, ...prev]);
      }
      setSaveError("Failed to archive goal. Please try again.");
    }
  };

  const handleRestoreGoal = async (id: string) => {
    const goalToRestore = archivedGoals.find((goal) => goal.id === id);
    setArchivedGoals((prev) => prev.filter((goal) => goal.id !== id));

    try {
      await storage.restoreGoal(id);
      await Promise.all([
        fetchGoals(),
        fetchArchivedGoals(),
        fetchArchivedGoalHistory(),
      ]);
    } catch (err) {
      console.error("Failed to restore goal:", err);
      if (goalToRestore) {
        setArchivedGoals((prev) => [goalToRestore, ...prev]);
      }
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      category: goal.category,
      color: goal.color || "",
      priority: goal.priority,
      deadline: goal.deadline || "",
      note: goal.note || "",
      repeat: goal.repeat || "None",
    });
    setIsAddingGoal(true);
  };

  return {
    goals,
    archivedGoals,
    archivedGoalHistory,
    setGoals,
    fetchGoals,
    fetchArchivedGoals,
    fetchArchivedGoalHistory,
    handleAddGoal,
    handleDeleteGoal,
    handleRestoreGoal,
    handleEditGoal,
    activeGoalId,
    setActiveGoalId,
    editingGoal,
    setEditingGoal,
    isAddingGoal,
    setIsAddingGoal,
    isSaving,
    setIsSaving,
    saveError,
    setSaveError,
    newGoal,
    setNewGoal,
    resetGoalForm,
    cancelGoalForm,
    defaultGoalForm,
  };
}
