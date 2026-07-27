import React, { useCallback, useEffect, useMemo, useState } from "react";
import { storage, type Category, type Habit } from "../storage";

const uid = () => crypto.randomUUID();

type UseHabitsOptions = {
  categories: Category[];
  confirmAction: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
  }) => Promise<boolean>;
};

const getDefaultHabitForm = (categories: Category[]): Partial<Habit> => ({
  title: "",
  category: categories[0]?.name || "Health",
  repeat: "Daily",
  due_date: "",
  created_at: new Date().toISOString().split('T')[0],
  color: "",
});

function toStartOfDayIso(date?: string) {
  if (!date) return new Date().toISOString();
  const day = date.slice(0, 10);
  return new Date(`${day}T00:00:00`).toISOString();
}

export function useHabits({ categories, confirmAction }: UseHabitsOptions) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [archivedHabitHistory, setArchivedHabitHistory] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>(() =>
    getDefaultHabitForm(categories),
  );

  const defaultHabitForm = useMemo(
    () => getDefaultHabitForm(categories),
    [categories],
  );

  useEffect(() => {
    if (categories.length === 0) return;
    setNewHabit((prev) =>
      prev.category ? prev : { ...prev, category: categories[0].name },
    );
  }, [categories]);

  useEffect(() => {
    if (!isAddingHabit && !editingHabit) {
      setSaveError(null);
    }
  }, [isAddingHabit, editingHabit]);

  const resetHabitForm = useCallback(() => {
    setNewHabit(defaultHabitForm);
  }, [defaultHabitForm]);

  const fetchHabits = async () => {
    const habitsData = await storage.getHabits();
    setHabits(habitsData);
    return habitsData;
  };

  const fetchArchivedHabits = async () => {
    const archivedHabitsData = await storage.getArchivedHabits();
    setArchivedHabits(archivedHabitsData);
    return archivedHabitsData;
  };

  const fetchArchivedHabitHistory = async () => {
    const archivedHabitsData = await storage.getArchivedHabitHistory();
    setArchivedHabitHistory(archivedHabitsData);
    return archivedHabitsData;
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !newHabit.title) return;
    setSaveError(null);
    const repeat: Habit["repeat"] = newHabit.repeat || "Daily";
    if ((repeat === "Weekly" || repeat === "Monthly") && !newHabit.created_at) {
      setSaveError("Start date is required for scheduled habits.");
      return;
    }

    const tempId = uid() as string;
    const createdAt = toStartOfDayIso(newHabit.created_at);
    const optimisticHabit = {
      id: tempId,
      title: newHabit.title as string,
      description: newHabit.description || undefined,
      category: newHabit.category as string,
      repeat,
      due_date: newHabit.due_date,
      color: newHabit.color || undefined,
      created_at: createdAt,
      completed_dates: [],
      streak: 0,
    };

    if (!editingHabit) {
      setHabits((prev) => [...prev, optimisticHabit]);
    }

    setIsSaving(true);
    try {
      if (editingHabit) {
        await storage.updateHabit(editingHabit.id, {
          ...newHabit,
          repeat,
          created_at: createdAt,
        });
        setEditingHabit(null);
        await fetchHabits();
      } else {
        await storage.addHabit(optimisticHabit);
        await fetchHabits();
      }
      setIsAddingHabit(false);
      resetHabitForm();
    } catch (error) {
      console.error("Error in handleAddHabit:", error);
      if (!editingHabit) {
        setHabits((prev) => prev.filter((h) => h.id !== tempId));
      }
      setSaveError(
        error instanceof Error
          ? `Failed to save habit: ${error.message}`
          : "An unexpected error occurred while saving.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    const shouldDelete = await confirmAction({
      title: "Delete Habit?",
      message:
        "This moves the habit to Profile archive for 15 days. Your completion history stays saved.",
      confirmLabel: "Delete",
    });
    if (!shouldDelete) return;

    const habitToArchive = habits.find((habit) => habit.id === id);
    setHabits((prev) => prev.filter((h) => h.id !== id));

    try {
      await storage.deleteHabit(id);
      if (editingHabit?.id === id) {
        setIsAddingHabit(false);
        setEditingHabit(null);
        setSaveError(null);
        resetHabitForm();
      }
      await Promise.all([
        fetchHabits(),
        fetchArchivedHabits(),
        fetchArchivedHabitHistory(),
      ]);
    } catch (err) {
      console.error("Failed to delete habit:", err);
      if (habitToArchive) {
        setHabits((prev) => [habitToArchive, ...prev]);
      }
      setSaveError("Failed to archive habit. Please try again.");
    }
  };

  const handleRestoreHabit = async (id: string) => {
    const habitToRestore = archivedHabits.find((habit) => habit.id === id);
    setArchivedHabits((prev) => prev.filter((habit) => habit.id !== id));

    try {
      await storage.restoreHabit(id);
      await Promise.all([
        fetchHabits(),
        fetchArchivedHabits(),
        fetchArchivedHabitHistory(),
      ]);
    } catch (err) {
      console.error("Failed to restore habit:", err);
      if (habitToRestore) {
        setArchivedHabits((prev) => [habitToRestore, ...prev]);
      }
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabit(habit);
    setIsAddingHabit(true);
  };

  const cancelHabitForm = useCallback(() => {
    setIsAddingHabit(false);
    setEditingHabit(null);
    setSaveError(null);
    resetHabitForm();
  }, [resetHabitForm]);

  return {
    habits,
    archivedHabits,
    archivedHabitHistory,
    setHabits,
    fetchGoals: fetchHabits,
    fetchHabits,
    fetchArchivedHabits,
    fetchArchivedHabitHistory,
    handleAddHabit,
    handleDeleteHabit,
    handleRestoreHabit,
    handleEditHabit,
    editingHabit,
    setEditingHabit,
    isAddingHabit,
    setIsAddingHabit,
    isSaving,
    setIsSaving,
    saveError,
    setSaveError,
    newHabit,
    setNewHabit,
    resetHabitForm,
    cancelHabitForm,
    defaultHabitForm,
  };
}
