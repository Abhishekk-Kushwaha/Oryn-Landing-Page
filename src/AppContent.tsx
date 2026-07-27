import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  format,
  isSameMonth,
  isSameDay,
  isSameWeek,
  parseISO,
} from "date-fns";
import {
  storage,
  isCompletedOnDate,
  type Goal,
  type Milestone,
} from "./storage";
import { RotateCcw, Trash2, X, Sparkles } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { ViewContainer } from "./components/ViewContainer";
import { InitialDataSkeleton } from "./components/InitialDataSkeleton";
import { useAppRouter } from "./hooks/useAppRouter";
import { useAppInteractions } from "./hooks/useAppInteractions";
import { useGoals } from "./hooks/useGoals";
import { useHabits } from "./hooks/useHabits";
import { useToday } from "./hooks/useToday";
import { useSessionState } from "./hooks/useSessionState";
import { useCategories } from "./hooks/useCategories";
import { useCalendarData } from "./hooks/useCalendarData";
import { useDashboardData } from "./hooks/useDashboardData";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import {
  readBrandStorage,
  removeBrandStorage,
  writeBrandStorage,
} from "./lib/brand";
import { applyTheme, persistTheme, readStoredTheme } from "./lib/theme";

import { CustomizeDashboardModal } from "./components/modals/CustomizeDashboardModal";
import { GoalModal } from "./components/modals/GoalModal";
import { HabitModal } from "./components/modals/HabitModal";
import { MilestoneModal } from "./components/modals/MilestoneModal";
import { CategoryModal } from "./components/modals/CategoryModal";
import { ConfirmDialog } from "./components/modals/ConfirmDialog";
import { PaywallView } from "./components/PaywallView";
import { PricingModal } from "./components/PricingModal";

// --- Utility ---
const uid = () => crypto.randomUUID();
const MILESTONE_DELETE_UNDO_MS = 5000;
const createDefaultMilestoneForm = () => ({
  title: "",
  due_date: "",
  note: "",
  goal_id: "",
  repeat: "None" as "None" | "Daily" | "Weekly" | "Monthly",
});

// --- Types ---
// Types are now imported from storage.ts

// --- Components ---

// Card and Badge extracted

type WidgetId =
  | "stats"
  | "progress";

type NavItem = {
  id: string;
  label: string;
  icon: string;
};

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  label: string;
}

type ConfirmDialogState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  resolve: ((value: boolean) => void) | null;
};

type PendingMilestoneDeletion = {
  undoId: string;
  goalId: string;
  goalTitle: string;
  milestone: Milestone;
  originalIndex: number;
  deletedAt: number;
  expiresAt: number;
};

type MilestoneCompletionOperation = {
  id: string;
  goalId: string;
  targetDate: Date;
  done: boolean;
};

function applyPendingMilestoneDeletesToGoal(
  goal: Goal,
  pendingDeletes: PendingMilestoneDeletion[],
) {
  const hiddenIds = new Set(
    pendingDeletes
      .filter((item) => item.goalId === goal.id)
      .map((item) => item.milestone.id),
  );

  if (hiddenIds.size === 0) return goal;

  const filteredGoal = {
    ...goal,
    milestones: (goal.milestones || []).filter((ms) => !hiddenIds.has(ms.id)),
  };
  storage.updateGoalProgress(filteredGoal);
  return filteredGoal;
}

function applyPendingMilestoneDeletesToGoals(
  goals: Goal[],
  pendingDeletes: PendingMilestoneDeletion[],
) {
  if (pendingDeletes.length === 0) return goals;
  return goals.map((goal) =>
    applyPendingMilestoneDeletesToGoal(goal, pendingDeletes),
  );
}

// Tooltips extracted

export default function App({ onExit }: { onExit?: () => void }) {
  const { session, isSessionLoading } = useSessionState();
  const { view, setView } = useAppRouter();
  
  // Track Pro status
  const [isProUser, setIsProUser] = useState(false);
  useEffect(() => {
    if (session?.user?.user_metadata?.is_pro === true) {
      setIsProUser(true);
    }
  }, [session]);

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [showDemoInstruction, setShowDemoInstruction] = useState(true);

  const [isCustomizingLayout, setIsCustomizingLayout] = useState(false);
  const [dismissedConquered, setDismissedConquered] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState<WidgetConfig[]>(() => {
    const defaultLayout: WidgetConfig[] = [
      { id: "stats", visible: true, label: "Quick Stats" },
      { id: "progress", visible: true, label: "Goal Progress" },
    ];
    const allowedWidgetIds = new Set(defaultLayout.map((widget) => widget.id));

    const saved = readBrandStorage("dashboardLayout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as WidgetConfig[];
        const merged = parsed.filter((widget) => allowedWidgetIds.has(widget.id));
        defaultLayout.forEach((def) => {
          if (!merged.find((m) => m.id === def.id)) {
            merged.push(def);
          }
        });
        return merged;
      } catch (e) {
        return defaultLayout;
      }
    }
    return defaultLayout;
  });

  useEffect(() => {
    writeBrandStorage("dashboardLayout", JSON.stringify(dashboardLayout));
  }, [dashboardLayout]);

  const [theme, setThemeState] = useState<"light" | "dark">(() => readStoredTheme());

  const setTheme = (next: "light" | "dark") => {
    setThemeState(next);
    persistTheme(next);
    applyTheme(next);
  };
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Delete",
    resolve: null,
  });

  const requestConfirm = useCallback(
    ({
      title,
      message,
      confirmLabel = "Delete",
    }: {
      title: string;
      message: string;
      confirmLabel?: string;
    }) =>
      new Promise<boolean>((resolve) => {
        setConfirmDialog({
          open: true,
          title,
          message,
          confirmLabel,
          resolve,
        });
      }),
    [],
  );

  const closeConfirmDialog = useCallback((confirmed: boolean) => {
    setConfirmDialog((current) => {
      current.resolve?.(confirmed);
      return {
        open: false,
        title: "",
        message: "",
        confirmLabel: "Delete",
        resolve: null,
      };
    });
  }, []);

  useEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  const {
    categories,
    setCategories,
    editingCategory,
    setEditingCategory,
    isAddingCategory,
    setIsAddingCategory,
    newCategory,
    setNewCategory,
    fetchCategories,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
  } = useCategories({
    onCategoriesChanged: () => fetchGoals(),
    confirmAction: requestConfirm,
  });

  const {
    goals,
    archivedGoals,
    archivedGoalHistory,
    setGoals,
    fetchGoals: fetchGoalList,
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
    isSaving: goalIsSaving,
    saveError: goalSaveError,
    newGoal,
    setNewGoal,
    cancelGoalForm,
  } = useGoals({ categories, setView, confirmAction: requestConfirm });

  const {
    habits,
    archivedHabits,
    archivedHabitHistory,
    setHabits,
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
    isSaving: habitIsSaving,
    saveError: habitSaveError,
    newHabit,
    setNewHabit,
    cancelHabitForm,
  } = useHabits({ categories, confirmAction: requestConfirm });
  const goalsRef = useRef(goals);

  const [isFocusMode, setIsFocusMode] = useState(false);
  // Initialise from localStorage for instant render; will be overridden by
  // loaded data once goals finish loading.
  const [featuredGoalId, setFeaturedGoalId] = useState<string | null>(() => {
    return readBrandStorage("featuredGoalId");
  });
  // Track whether we've already synced the featured goal
  const featuredGoalSyncedRef = useRef(false);
  const featuredGoalStateReadyRef = useRef(false);
  const {
    requestInstallApp,
    showInstallHelp,
    setShowInstallHelp,
    installPlatform,
    isAppInstalled,
  } = useInstallPrompt();
  const [initialDataLoadedForUserId, setInitialDataLoadedForUserId] =
    useState<string | null>(null);
  const [initialGoalLoad, setInitialGoalLoad] = useState<{
    userId: string;
    count: number;
  } | null>(null);
  const sessionUserId = session?.user?.id || null;
  const isInitialDataLoading = Boolean(
    sessionUserId && initialDataLoadedForUserId !== sessionUserId,
  );

  // --- Featured goal: write to localStorage ---
  const setFeaturedGoalIdPersisted = useCallback((id: string | null) => {
    setFeaturedGoalId(id);
    // Update localStorage cache immediately
    if (id) {
      writeBrandStorage("featuredGoalId", id);
    } else {
      removeBrandStorage("featuredGoalId");
    }
    // Persist to storage so it survives page refreshes
    storage.setFeaturedGoal(id).catch((err) => {
      console.error("Failed to persist featured goal:", err);
    });
  }, []);

  const syncFeaturedGoalFromGoals = useCallback(
    async (goalList: Goal[]) => {
      if (goalList.length === 0) {
        setFeaturedGoalId(null);
        removeBrandStorage("featuredGoalId");
        return;
      }

      const dbFeatured = goalList.find((g) => g.is_featured);
      if (dbFeatured) {
        setFeaturedGoalId(dbFeatured.id);
        writeBrandStorage("featuredGoalId", dbFeatured.id);
        return;
      }

      const localId = readBrandStorage("featuredGoalId");
      const localGoalExists = localId && goalList.some((g) => g.id === localId);
      const newFeaturedId = localGoalExists ? localId : goalList[0].id;

      setFeaturedGoalId(newFeaturedId);
      writeBrandStorage("featuredGoalId", newFeaturedId);

      try {
        await storage.setFeaturedGoal(newFeaturedId);
      } catch (error) {
        console.error("Failed to backfill featured goal in storage:", error);
      }
    },
    [],
  );

  // Guard: if the currently featured goal gets deleted, pick a new one.
  useEffect(() => {
    if (!sessionUserId) return;
    if (isInitialDataLoading) return;
    if (!featuredGoalSyncedRef.current) return;
    if (initialGoalLoad?.userId !== sessionUserId) return;
    if (!featuredGoalStateReadyRef.current) return;
    if (goals.length === 0) {
      if (featuredGoalId !== null) setFeaturedGoalIdPersisted(null);
      return;
    }
    if (featuredGoalId && goals.some((g) => g.id === featuredGoalId)) return;
    setFeaturedGoalIdPersisted(goals[0].id);
  }, [
    featuredGoalId,
    goals,
    initialGoalLoad,
    isInitialDataLoading,
    sessionUserId,
    setFeaturedGoalIdPersisted,
  ]);

  useEffect(() => {
    if (!sessionUserId) return;
    if (!featuredGoalSyncedRef.current) return;
    if (featuredGoalStateReadyRef.current) return;
    if (initialGoalLoad?.userId !== sessionUserId) return;

    if (initialGoalLoad.count === 0 || goals.length > 0) {
      featuredGoalStateReadyRef.current = true;
    }
  }, [goals, initialGoalLoad, sessionUserId]);

  const [pendingMilestoneDeletes, setPendingMilestoneDeletes] = useState<
    PendingMilestoneDeletion[]
  >([]);
  const pendingMilestoneDeletesRef = useRef<PendingMilestoneDeletion[]>([]);
  const pendingMilestoneDeleteTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  const updatePendingMilestoneDeletes = useCallback(
    (
      updater:
        | PendingMilestoneDeletion[]
        | ((prev: PendingMilestoneDeletion[]) => PendingMilestoneDeletion[]),
    ) => {
      setPendingMilestoneDeletes((prev) => {
        const next =
          typeof updater === "function"
            ? updater(prev)
            : updater;
        pendingMilestoneDeletesRef.current = next;
        return next;
      });
    },
    [],
  );

  const clearPendingMilestoneDeleteTimer = useCallback((undoId: string) => {
    const timer = pendingMilestoneDeleteTimersRef.current.get(undoId);
    if (timer) {
      clearTimeout(timer);
      pendingMilestoneDeleteTimersRef.current.delete(undoId);
    }
  }, []);

  const sanitizeGoalWithPendingDeletes = useCallback(
    (goal: Goal) =>
      applyPendingMilestoneDeletesToGoal(
        goal,
        pendingMilestoneDeletesRef.current,
      ),
    [],
  );

  const fetchGoals = async () => {
    const [goalsData] = await Promise.all([
      fetchGoalList(),
      fetchArchivedGoals(),
      fetchArchivedGoalHistory(),
      fetchHabits(),
      fetchArchivedHabits(),
      fetchArchivedHabitHistory(),
    ]);
    const filteredGoals = applyPendingMilestoneDeletesToGoals(
      goalsData,
      pendingMilestoneDeletesRef.current,
    );
    setGoals(filteredGoals);
    return filteredGoals;
  };

  const [milestoneSaving, setMilestoneSaving] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const isSaving = goalIsSaving || habitIsSaving || milestoneSaving;

  const [newMilestone, setNewMilestone] = useState(createDefaultMilestoneForm);
  const resetMilestoneForm = useCallback(() => {
    setNewMilestone(createDefaultMilestoneForm());
  }, []);
  const closeMilestoneModal = useCallback(() => {
    setIsAddingMilestone(false);
    setEditingMilestone(null);
    resetMilestoneForm();
  }, [resetMilestoneForm]);
  const openMilestoneEditor = useCallback((milestone: Milestone) => {
    setIsAddingMilestone(false);
    setEditingMilestone(milestone);
    setNewMilestone({
      ...createDefaultMilestoneForm(),
      title: milestone.title,
      due_date: milestone.due_date || "",
      note: milestone.note || "",
      goal_id: milestone.goal_id || "",
      repeat: milestone.repeat || "None",
    });
  }, []);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [showMomentumMobile, setShowMomentumMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomizingNav, setIsCustomizingNav] = useState(false);

  const {
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
  } = useCalendarData({
    goals,
    archivedGoalHistory,
    habits,
    archivedHabitHistory,
    categories,
    setGoals,
  });

  useEffect(() => {
    let isCancelled = false;
    const userId = sessionUserId;
    featuredGoalSyncedRef.current = false;
    featuredGoalStateReadyRef.current = false;
    setInitialGoalLoad(null);

    if (session && userId) {
      const loadData = async () => {
        const [goalsData] = await Promise.all([fetchGoals(), fetchCategories()]);
        if (isCancelled) return;
        await syncFeaturedGoalFromGoals(goalsData);
        if (isCancelled) return;
        featuredGoalSyncedRef.current = true;
        featuredGoalStateReadyRef.current = goalsData.length === 0;
        setInitialGoalLoad({
          userId,
          count: goalsData.length,
        });
        setInitialDataLoadedForUserId(userId);
      };

      void loadData()
        .catch((error) => {
          if (!isCancelled) {
            console.error("Initial app data failed to load:", error);
          }
        });
    } else {
      featuredGoalSyncedRef.current = false;
      featuredGoalStateReadyRef.current = false;
      setInitialDataLoadedForUserId(null);
      setInitialGoalLoad(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [sessionUserId, syncFeaturedGoalFromGoals]);

  useEffect(() => {
    if (categories.length === 0) return;
    setNewGoal((prev) => ({ ...prev, category: prev.category || categories[0].name }));
    setNewHabit((prev) => ({ ...prev, category: prev.category || categories[0].name }));
  }, [categories]);

  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [navOrder, setNavOrder] = useState<NavItem[]>(() => {
    const defaultNav: NavItem[] = [
      { id: "today", label: "Today", icon: "Sun" },
      { id: "dash", label: "Profile", icon: "LayoutDashboard" },
      { id: "planner", label: "Planner", icon: "CalendarDays" },
      { id: "habits", label: "Habits", icon: "Activity" },
      { id: "goals", label: "Goals", icon: "Target" },
      { id: "categories", label: "Categories", icon: "Filter" },
      { id: "calendar", label: "Calendar", icon: "Calendar" },
    ];
    const saved = readBrandStorage("navOrder");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as NavItem[];
        const merged = [...parsed];
        defaultNav.forEach((def) => {
          if (!merged.find((m) => m.id === def.id)) merged.push(def);
        });
        return merged;
      } catch (e) {
        return defaultNav;
      }
    }
    return defaultNav;
  });

  useEffect(() => {
    writeBrandStorage("navOrder", JSON.stringify(navOrder));
  }, [navOrder]);

  const {
    setHabitCompletedOptimistic,
    setGoalCompletionOptimistic,
    toggleHabitOptimistic,
    toggleGoalCompletionOptimistic,
  } = useAppInteractions({ setHabits, setGoals });
  const [pendingMilestoneIds, setPendingMilestoneIds] = useState<Set<string>>(
    () => new Set(),
  );
  const pendingMilestoneIdsRef = useRef(new Set<string>());
  const pendingMilestonePromisesRef = useRef(new Map<string, Promise<void>>());
  const milestoneGoalQueuesRef = useRef(new Map<string, Promise<void>>());
  const [, setActiveMilestoneRequestByGoal] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  const {
    todayMilestones,
    todayProgress,
    highestStreak,
    yesterdayCompletedCount,
    personalBest,
    yesterdayProgress,
    barPulse,
    showBreather,
    breatherMessage,
    floatingPoints,
    slidingOut,
    lastCompleted,
    breatherTimeout,
    setShowBreather,
    setSlidingOut,
    setBreatherTimeout,
    getHeroTheme,
    getBarColor,
    getHypeText,
    getStreakMessage,
    getTaskPoints,
    handleToggleToday,
    handleArenaComplete,
    todayCompletedCount,
    todayTotalCount,
    pendingTodayTaskKeys,
    getTodayTaskKey,
  } = useToday({
    allCalendarItems,
    goals,
    getItemsForDate,
    getHistoricalItemsForDate,
    setHabitCompleted: setHabitCompletedOptimistic,
    setGoalCompleted: setGoalCompletionOptimistic,
    setMilestoneCompleted: (id, date, done) =>
      setMilestoneCompletedOptimistic(id, date, done),
    setDismissedConquered,
    currentDate,
  });

  const {
    stats,
    chartData,
  } = useDashboardData({
    goals,
    categories,
    activeGoalId,
  });

  const handleAddPlannerTask = async (
    title: string,
    date: Date,
    repeat: Milestone["repeat"],
  ) => {
    let targetGoalId = "";
    let generalGoal = goals.find((g) => g.title === "General Tasks");
    if (!generalGoal) {
      const newGoal: Goal = {
        id: uid(),
        title: "General Tasks",
        category: categories[0]?.name || "Personal",
        priority: "Medium",
        progress: 0,
        streak: 0,
        milestones: [],
        repeat: "None",
      };
      setGoals((prev) => [...prev, newGoal]);
      generalGoal = newGoal;

      storage.addGoal(newGoal).catch((err) => {
        console.error("Failed to add General Tasks goal", err);
        setGoals((prev) => prev.filter((g) => g.id !== newGoal.id));
      });
    }
    targetGoalId = generalGoal?.id || "";

    if (!targetGoalId) return;

    const milestoneData: Milestone = {
      title,
      due_date: format(date, "yyyy-MM-dd"),
      repeat,
      goal_id: targetGoalId,
      id: uid(),
      done: false,
      completed_dates: [],
    };

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === targetGoalId) {
          return {
            ...g,
            milestones: [...(g.milestones || []), milestoneData],
          };
        }
        return g;
      }),
    );

    storage
      .addMilestone(milestoneData)
      .then((updatedGoal) => {
        if (updatedGoal) {
          setGoals((prev) =>
            prev.map((g) =>
              g.id === updatedGoal.id
                ? sanitizeGoalWithPendingDeletes(updatedGoal)
                : g,
            ),
          );
        }
      })
      .catch((error) => {
        console.error("Error adding planner task:", error);
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id === targetGoalId) {
              return {
                ...g,
                milestones: (g.milestones || []).filter(
                  (m) => m.id !== milestoneData.id,
                ),
              };
            }
            return g;
          }),
        );
      });
  };

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newMilestone.title.trim();

    if (isSaving || !title) return;

    setMilestoneSaving(true);
    try {
      if (editingMilestone) {
        await editMilestone(editingMilestone.id, {
          title,
          due_date: newMilestone.due_date || null,
          repeat: newMilestone.repeat,
        });
        closeMilestoneModal();
        return;
      }

      let targetGoalId = activeGoalId || newMilestone.goal_id;
      if (!targetGoalId || targetGoalId === "none") {
        let generalGoal = goals.find((g) => g.title === "General Tasks");
        if (!generalGoal) {
          const newGoal: Goal = {
            id: uid(),
            title: "General Tasks",
            category: categories[0]?.name || "Personal",
            priority: "Medium",
            progress: 0,
            streak: 0,
            milestones: [],
            repeat: "None",
          };
          setGoals((prev) => [...prev, newGoal]);
          generalGoal = newGoal;

          try {
            await storage.addGoal(newGoal);
          } catch (error) {
            setGoals((prev) => prev.filter((g) => g.id !== newGoal.id));
            throw error;
          }
        }
        targetGoalId = generalGoal.id;
      }

      const milestoneData: Milestone = {
        ...newMilestone,
        title,
        goal_id: targetGoalId,
        id: uid(),
        done: false,
        completed_dates: [],
      };

      setGoals((prev) =>
        prev.map((g) => {
          if (g.id === targetGoalId) {
            return {
              ...g,
              milestones: [...(g.milestones || []), milestoneData],
            };
          }
          return g;
        }),
      );

      closeMilestoneModal();

      storage.addMilestone(milestoneData).then((updatedGoal) => {
        if (updatedGoal) {
          setGoals((prev) =>
            prev.map((g) =>
              g.id === updatedGoal.id
                ? sanitizeGoalWithPendingDeletes(updatedGoal)
                : g,
            ),
          );
        }
      }).catch((error) => {
        console.error("Error in handleAddMilestone:", error);
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id === targetGoalId) {
              return {
                ...g,
                milestones: (g.milestones || []).filter(
                  (m) => m.id !== milestoneData.id,
                ),
              };
            }
            return g;
          }),
        );
      });
    } catch (error) {
      console.error("Error in handleAddMilestone setup:", error);
    } finally {
      setMilestoneSaving(false);
    }
  };

  const getCompletedDatesForState = (
    completedDates: string[] | undefined,
    repeat: string | undefined,
    targetDate: Date,
    done: boolean,
  ) => {
    const currentDates = completedDates || [];
    const isCompleted = isCompletedOnDate(
      { repeat, completed_dates: currentDates },
      targetDate,
    );

    if (done && !isCompleted) {
      return [...currentDates, targetDate.toISOString()];
    }

    if (!done && isCompleted) {
      return currentDates.filter((d: string) => {
        const dDate = parseISO(d);
        if (repeat === "Daily") return !isSameDay(dDate, targetDate);
        if (repeat === "Weekly") return !isSameWeek(dDate, targetDate);
        if (repeat === "Monthly") return !isSameMonth(dDate, targetDate);
        return true;
      });
    }

    return currentDates;
  };

  const findMilestoneContext = useCallback(
    (milestoneId: string, goalList: Goal[] = goalsRef.current) => {
      for (const goal of goalList) {
        const milestone = goal.milestones?.find((item) => item.id === milestoneId);
        if (milestone) {
          return {
            goalId: goal.id,
            milestone,
          };
        }
      }

      return {
        goalId: null,
        milestone: null,
      };
    },
    [],
  );

  const addPendingMilestoneId = useCallback((milestoneId: string) => {
    if (pendingMilestoneIdsRef.current.has(milestoneId)) return;

    pendingMilestoneIdsRef.current.add(milestoneId);
    setPendingMilestoneIds((prev) => {
      if (prev.has(milestoneId)) return prev;
      const next = new Set(prev);
      next.add(milestoneId);
      return next;
    });
  }, []);

  const removePendingMilestoneId = useCallback((milestoneId: string) => {
    if (!pendingMilestoneIdsRef.current.has(milestoneId)) return;

    pendingMilestoneIdsRef.current.delete(milestoneId);
    setPendingMilestoneIds((prev) => {
      if (!prev.has(milestoneId)) return prev;
      const next = new Set(prev);
      next.delete(milestoneId);
      return next;
    });
  }, []);

  const setActiveMilestoneRequestForGoal = useCallback(
    (goalId: string, milestoneId: string | null) => {
      setActiveMilestoneRequestByGoal((prev) => {
        if (milestoneId === null) {
          if (!(goalId in prev)) return prev;
          const next = { ...prev };
          delete next[goalId];
          return next;
        }

        if (prev[goalId] === milestoneId) return prev;
        return {
          ...prev,
          [goalId]: milestoneId,
        };
      });
    },
    [],
  );

  const applyMilestoneCompletionToGoals = useCallback(
    (
      sourceGoals: Goal[],
      milestoneId: string,
      targetDate: Date,
      done: boolean,
    ) => {
      let didUpdate = false;

      const nextGoals = sourceGoals.map((goal) => {
        const milestone = goal.milestones?.find((item) => item.id === milestoneId);
        if (!milestone) return goal;

        didUpdate = true;
        const updatedMilestone = { ...milestone };

        if (updatedMilestone.repeat && updatedMilestone.repeat !== "None") {
          updatedMilestone.completed_dates = getCompletedDatesForState(
            updatedMilestone.completed_dates,
            updatedMilestone.repeat,
            targetDate,
            done,
          );
        } else {
          updatedMilestone.done = done;
          updatedMilestone.completed_at = done
            ? new Date().toISOString()
            : undefined;
        }

        const updatedGoal = {
          ...goal,
          milestones: goal.milestones?.map((item) =>
            item.id === milestoneId ? updatedMilestone : item,
          ),
        };
        storage.updateGoalProgress(updatedGoal);
        return updatedGoal;
      });

      return didUpdate ? nextGoals : sourceGoals;
    },
    [],
  );

  const executeMilestoneCompletionOperation = useCallback(
    async ({ id, goalId, targetDate, done }: MilestoneCompletionOperation) => {
      setActiveMilestoneRequestForGoal(goalId, id);
      let rollbackGoal: Goal | null = null;

      setGoals((prev) => {
        const currentGoal = prev.find((goal) => goal.id === goalId) || null;
        rollbackGoal = currentGoal
          ? {
              ...currentGoal,
              milestones: (currentGoal.milestones || []).map((milestone) => ({
                ...milestone,
                completed_dates: milestone.completed_dates
                  ? [...milestone.completed_dates]
                  : [],
              })),
            }
          : null;
        const next = applyMilestoneCompletionToGoals(
          prev,
          id,
          targetDate,
          done,
        );
        goalsRef.current = next;
        return next;
      });

      try {
        const updatedGoal = await storage.setMilestoneCompleted(
          id,
          targetDate,
          done,
        );

        if (updatedGoal) {
          setGoals((prev) => {
            const next = prev.map((goal) =>
              goal.id === updatedGoal.id
                ? sanitizeGoalWithPendingDeletes(updatedGoal)
                : goal,
            );
            goalsRef.current = next;
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to set milestone completion:", err);
        if (rollbackGoal) {
          setGoals((prev) => {
            const next = prev.map((goal) =>
              goal.id === goalId ? rollbackGoal! : goal,
            );
            goalsRef.current = next;
            return next;
          });
        }
      } finally {
        setActiveMilestoneRequestForGoal(goalId, null);
        removePendingMilestoneId(id);
      }
    },
    [
      applyMilestoneCompletionToGoals,
      removePendingMilestoneId,
      sanitizeGoalWithPendingDeletes,
      setActiveMilestoneRequestForGoal,
      setGoals,
    ],
  );

  const setMilestoneCompletedQueued = useCallback(
    async (
      id: string,
      date: string | undefined,
      done: boolean,
    ) => {
      const existingPromise = pendingMilestonePromisesRef.current.get(id);
      if (existingPromise) {
        await existingPromise;
        return;
      }

      const { goalId } = findMilestoneContext(id);
      if (!goalId) return;

      addPendingMilestoneId(id);

      const operation: MilestoneCompletionOperation = {
        id,
        goalId,
        targetDate: date ? parseISO(date) : new Date(),
        done,
      };

      const currentGoalQueue =
        milestoneGoalQueuesRef.current.get(goalId) || Promise.resolve();
      const requestPromise = currentGoalQueue
        .catch(() => undefined)
        .then(() => executeMilestoneCompletionOperation(operation))
        .finally(() => {
          if (milestoneGoalQueuesRef.current.get(goalId) === requestPromise) {
            milestoneGoalQueuesRef.current.delete(goalId);
          }
          if (pendingMilestonePromisesRef.current.get(id) === requestPromise) {
            pendingMilestonePromisesRef.current.delete(id);
          }
        });

      milestoneGoalQueuesRef.current.set(goalId, requestPromise);
      pendingMilestonePromisesRef.current.set(id, requestPromise);

      await requestPromise;
    },
    [
      addPendingMilestoneId,
      executeMilestoneCompletionOperation,
      findMilestoneContext,
    ],
  );

  const setMilestoneCompletedOptimistic = async (
    id: string,
    date: string | undefined,
    done: boolean,
  ) => {
    await setMilestoneCompletedQueued(id, date, done);
  };

  const toggleMilestone = async (id: string, date?: string) => {
    const targetDate = date ? parseISO(date) : new Date();

    // Read the current milestone state directly from the goals snapshot.
    // Using a setState callback to read state is unreliable — React batches
    // updates so desiredDone would always stay `true`, making it impossible
    // to ever uncheck a milestone.
    const { milestone } = findMilestoneContext(id);
    const desiredDone =
      milestone
        ? milestone.repeat && milestone.repeat !== "None"
          ? !isCompletedOnDate(milestone, targetDate)
          : !milestone.done
        : true;

    await setMilestoneCompletedOptimistic(
      id,
      targetDate.toISOString(),
      desiredDone,
    );
  };
  useEffect(() => {
    setIsAddingGoal(false);
    setIsAddingHabit(false);
    setIsAddingCategory(false);
    closeMilestoneModal();
    setEditingGoal(null);
    setEditingHabit(null);
    setEditingCategory(null);
    setIsFocusMode(false);
    setIsCustomizingLayout(false);
    setIsCustomizingNav(false);
  }, [view, closeMilestoneModal]);

  useEffect(() => {
    const isAnyModalOpen =
      isAddingGoal ||
      isAddingHabit ||
      isAddingCategory ||
      isAddingMilestone ||
      !!editingMilestone ||
      !!editingGoal ||
      !!editingHabit ||
      !!editingCategory ||
      isFocusMode ||
      isCustomizingLayout ||
      isCustomizingNav ||
      isMobileMenuOpen ||
      confirmDialog.open;

    if (isAnyModalOpen) {
      window.history.pushState({ modal: true }, "");
    } else if (window.history.state?.modal) {
      window.history.back();
    }
  }, [
    isAddingGoal,
    isAddingHabit,
    isAddingCategory,
    isAddingMilestone,
    editingMilestone,
    editingGoal,
    editingHabit,
    editingCategory,
    isFocusMode,
    isCustomizingLayout,
    isCustomizingNav,
    isMobileMenuOpen,
    confirmDialog.open,
  ]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (!e.state?.modal) {
        setIsAddingGoal(false);
        setIsAddingHabit(false);
        setIsAddingCategory(false);
        closeMilestoneModal();
        setEditingGoal(null);
        setEditingHabit(null);
        setEditingCategory(null);
        setIsFocusMode(false);
        setIsCustomizingLayout(false);
        setIsCustomizingNav(false);
        setIsMobileMenuOpen(false);
        closeConfirmDialog(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [closeConfirmDialog, closeMilestoneModal]);

  useEffect(() => {
    return () => {
      pendingMilestoneDeleteTimersRef.current.forEach((timer) =>
        clearTimeout(timer),
      );
      pendingMilestoneDeleteTimersRef.current.clear();
    };
  }, []);
  const handleMarkAllDone = async (ids: string[]) => {
    // Optimistic update
    setGoals(prev => prev.map(g => ({
      ...g,
      milestones: g.milestones?.map(m => ids.includes(m.id) ? { ...m, done: true } : m)
    })));

    storage.setMilestonesDone(ids, true).then(updatedGoals => {
      if (updatedGoals && updatedGoals.length > 0) {
        setGoals(prev => prev.map(g => {
          const updated = updatedGoals.find(ug => ug.id === g.id);
          return updated ? sanitizeGoalWithPendingDeletes(updated) : g;
        }));
      }
    }).catch(err => console.error("Failed to mark all done:", err));
  };

  const restoreDeletedMilestone = useCallback(
    (deletion: PendingMilestoneDeletion) => {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id !== deletion.goalId) return goal;
          if ((goal.milestones || []).some((ms) => ms.id === deletion.milestone.id)) {
            return goal;
          }

          const milestones = [...(goal.milestones || [])];
          const safeIndex = Math.max(
            0,
            Math.min(deletion.originalIndex, milestones.length),
          );
          milestones.splice(safeIndex, 0, deletion.milestone);

          const restoredGoal = {
            ...goal,
            milestones,
          };
          storage.updateGoalProgress(restoredGoal);
          return restoredGoal;
        }),
      );
    },
    [setGoals],
  );

  const commitMilestoneDeletion = useCallback(
    async (deletion: PendingMilestoneDeletion) => {
      clearPendingMilestoneDeleteTimer(deletion.undoId);

      try {
        const updatedGoal = await storage.deleteMilestone(deletion.milestone.id);
        const remainingPending = pendingMilestoneDeletesRef.current.filter(
          (item) => item.undoId !== deletion.undoId,
        );
        updatePendingMilestoneDeletes(remainingPending);

        if (updatedGoal) {
          setGoals((prev) =>
            prev.map((goal) =>
              goal.id === updatedGoal.id
                ? applyPendingMilestoneDeletesToGoal(updatedGoal, remainingPending)
                : goal,
            ),
          );
        } else {
          await fetchGoals();
        }
      } catch (err) {
        console.error("Failed to delete milestone:", err);
        const remainingPending = pendingMilestoneDeletesRef.current.filter(
          (item) => item.undoId !== deletion.undoId,
        );
        updatePendingMilestoneDeletes(remainingPending);
        restoreDeletedMilestone(deletion);
      }
    },
    [
      clearPendingMilestoneDeleteTimer,
      fetchGoals,
      restoreDeletedMilestone,
      setGoals,
      updatePendingMilestoneDeletes,
    ],
  );

  const undoMilestoneDelete = useCallback(
    (undoId: string) => {
      const deletion = pendingMilestoneDeletesRef.current.find(
        (item) => item.undoId === undoId,
      );
      if (!deletion) return;

      clearPendingMilestoneDeleteTimer(undoId);
      const remainingPending = pendingMilestoneDeletesRef.current.filter(
        (item) => item.undoId !== undoId,
      );
      updatePendingMilestoneDeletes(remainingPending);
      restoreDeletedMilestone(deletion);
    },
    [
      clearPendingMilestoneDeleteTimer,
      restoreDeletedMilestone,
      updatePendingMilestoneDeletes,
    ],
  );

  const deleteMilestone = async (id: string) => {
    const targetGoal = goals.find((goal) =>
      goal.milestones?.some((milestone) => milestone.id === id),
    );
    const originalIndex =
      targetGoal?.milestones?.findIndex((milestone) => milestone.id === id) ?? -1;
    const milestone =
      originalIndex >= 0 ? targetGoal?.milestones?.[originalIndex] : null;

    if (!targetGoal || !milestone) return;

    if (view === "planner" && targetGoal.title !== "General Tasks") {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id !== targetGoal.id) return goal;

          const updatedGoal = {
            ...goal,
            milestones: (goal.milestones || []).map((ms) =>
              ms.id === id ? { ...ms, due_date: null } : ms
            ),
          };
          storage.updateGoalProgress(updatedGoal);
          return updatedGoal;
        }),
      );
      storage.updateMilestone(id, { due_date: null }).catch((err) => {
        console.error("Failed to unassign milestone:", err);
      });
      return;
    }

    const now = Date.now();
    const deletion: PendingMilestoneDeletion = {
      undoId: uid(),
      goalId: targetGoal.id,
      goalTitle: targetGoal.title,
      milestone: { ...milestone },
      originalIndex,
      deletedAt: now,
      expiresAt: now + MILESTONE_DELETE_UNDO_MS,
    };

    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== targetGoal.id) return goal;

        const updatedGoal = {
          ...goal,
          milestones: (goal.milestones || []).filter((ms) => ms.id !== id),
        };
        storage.updateGoalProgress(updatedGoal);
        return updatedGoal;
      }),
    );

    updatePendingMilestoneDeletes((prev) => [deletion, ...prev]);
    const timer = setTimeout(() => {
      void commitMilestoneDeletion(deletion);
    }, MILESTONE_DELETE_UNDO_MS);
    pendingMilestoneDeleteTimersRef.current.set(deletion.undoId, timer);
  };

  const editMilestone = async (id: string, updates: Partial<Milestone>) => {
    // Optimistic update
    setGoals(prev => prev.map(g => {
      const milestone = g.milestones?.find(m => m.id === id);
      if (!milestone) return g;

      const updatedMilestone = { ...milestone, ...updates };
      const updatedGoal = {
        ...g,
        milestones: g.milestones?.map(m => m.id === id ? updatedMilestone : m)
      };
      return updatedGoal;
    }));

    storage.updateMilestone(id, updates).then(updatedGoal => {
      if (updatedGoal) {
        setGoals(prev => prev.map(g =>
          g.id === updatedGoal.id
            ? sanitizeGoalWithPendingDeletes(updatedGoal)
            : g,
        ));
      }
    }).catch(err => console.error("Failed to edit milestone:", err));
  };

  const activeGoal = useMemo(
    () => goals.find((g) => g.id === activeGoalId),
    [goals, activeGoalId],
  );
  if (isSessionLoading) {
    return <InitialDataSkeleton view={view} />;
  }

  const sharedViewProps = {
    isProUser,
    onUpgradeClick: () => setIsPricingModalOpen(true),
    isCompletedOnDate,
    setView,
    setTheme,
    setSelectedDate,
    setActiveGoalId,
    setCurrentMonth,
    setIsFocusMode,
    isFocusMode,
    setCompletedExpanded,
    completedExpanded,
    setShowMomentumMobile,
    showMomentumMobile,
    setIsAddingCategory,
    setEditingCategory,
    todayCompletedCount,
    todayTotalCount,
    pendingTodayTaskKeys,
    getTodayTaskKey,
    setIsAddingGoal,
    setIsAddingHabit,
    setIsAddingMilestone,
    setIsCustomizingLayout,
    setDismissedConquered,
    newMilestone,
    setNewMilestone,
    setEditingGoal,
    setNewGoal,
    setEditingHabit,
    setNewHabit,
    setHabitCompletedOptimistic,
    setMilestoneCompleted: setMilestoneCompletedOptimistic,
    pendingMilestoneIds,
    toggleHabitOptimistic,
    toggleGoalCompletionOptimistic,
    toggleMilestone,
    handleEditGoal,
    handleEditMilestone: openMilestoneEditor,
    deleteMilestone,
    editMilestone,
    handleAddPlannerTask,
    handleDeleteGoal,
    handleRestoreGoal,
    handleDeleteHabit,
    handleRestoreHabit,
    handleDeleteCategory,
    handleMarkAllDone,
    handleToggleToday,
    handleArenaComplete,
    handleCalendarDragStart,
    handleCalendarDragEnd,
    fetchGoals,
    session,
    isInitialDataLoading,
    theme,
    currentDate,
    dashboardLayout,
    stats,
    chartData,
    currentMonth,
    selectedDate,
    milestonesForSelectedDate,
    todayMilestones,
    todayProgress,
    yesterdayProgress,
    yesterdayCompletedCount,
    dismissedConquered,
    personalBest,
    highestStreak,
    barPulse,
    floatingPoints,
    slidingOut,
    showBreather,
    breatherMessage,
    lastCompleted,
    breatherTimeout,
    setBreatherTimeout,
    setShowBreather,
    setSlidingOut,
    requestInstallApp,
    showInstallHelp,
    setShowInstallHelp,
    installPlatform,
    isAppInstalled,
    featuredGoalId,
    setFeaturedGoalId: setFeaturedGoalIdPersisted,
    goals,
    archivedGoals,
    habits,
    archivedHabits,
    categories,
    activeGoal,
    activeGoalId,
    unassignedMilestones,
    sensors,
    activeCalendarDragId,
    activeCalendarMilestone,
    getItemsForDate,
    getHistoricalItemsForDate,
    getHeroTheme,
    getBarColor,
    getHypeText,
    getStreakMessage,
  };

  return (
    <div
      className="flex h-[100dvh] overflow-hidden font-sans selection:bg-orange-500/30"
      style={{ background: "var(--app-bg)" }}
    >
      <Sidebar
        view={view}
        setView={setView}
        setActiveGoalId={setActiveGoalId}
        isMenuOpen={isMobileMenuOpen}
        setIsMenuOpen={setIsMobileMenuOpen}
        stats={stats}
        todayProgress={todayProgress}
        session={session}
        theme={theme}
        setTheme={setTheme}
        isProUser={isProUser}
        onUpgradeClick={() => setIsPricingModalOpen(true)}
        onExit={onExit}
      />

      {/* Main Content — flex-1 fills the space next to the permanent desktop sidebar */}
      <main
        className="min-w-0 flex-1 overflow-y-auto custom-scrollbar flex flex-col relative w-full pb-24 md:pb-0"
        style={{ background: "var(--app-bg)" }}
      >
        {onExit && (
          <div 
            className="sticky top-0 left-0 right-0 z-[1000] shrink-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-3 py-2 backdrop-blur-xl shadow-sm"
            style={{ 
              background: "color-mix(in srgb, var(--surface) 85%, transparent)", 
              borderBottom: "1px solid var(--surface-border)" 
            }}
          >
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--text-primary)" }}>
              <span className="text-orange-500 text-[14px]">⚡</span> 
              <span className="text-[12px] sm:text-[13px]">Demo Mode</span>
            </span>
            <button 
              onClick={onExit}
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-1.5 text-[11px] sm:text-[12px] font-black text-white shadow-[0_4px_12px_-3px_rgba(249,115,22,0.4)] transition-transform active:scale-[0.98]"
            >
              Unlock Oryn Pro
            </button>
          </div>
        )}

        <AnimatePresence>
          {onExit && showDemoInstruction && view === 'today' && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="pointer-events-auto relative overflow-hidden backdrop-blur-3xl border p-5 flex items-start gap-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-[24px] w-full max-w-[380px]"
                style={{ 
                  background: "var(--surface-modal)", 
                  borderColor: "var(--surface-border)"
                }}
              >
                {/* Glow effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-[24px] pointer-events-none">
                  <div className="absolute -top-[50%] -left-[20%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.15),transparent_60%)]" />
                  <div className="absolute -bottom-[50%] -right-[20%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.08),transparent_60%)]" />
                </div>

                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-[0_8px_16px_-6px_rgba(56,189,248,0.5)] ring-1 ring-white/20">
                  <Sparkles className="w-5 h-5" strokeWidth={2} />
                  {/* Inner shine */}
                  <div className="absolute inset-0 rounded-[16px] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                </div>
                
                <div className="relative z-10 flex-1 pr-6 pt-0.5">
                  <span className="font-extrabold text-[15px] sm:text-[16px] block mb-1.5 tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Your Daily Action Plan
                  </span>
                  <p className="text-[13px] leading-[1.6] font-medium opacity-80" style={{ color: "var(--text-primary)" }}>
                    This dashboard automatically organizes your habits, scheduled goals, and daily tasks into one clear, focused view.
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowDemoInstruction(false)}
                  className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X className="w-4 h-4 opacity-60 transition-opacity hover:opacity-100" style={{ color: "var(--text-primary)" }} strokeWidth={2.5} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ViewContainer view={view} sharedViewProps={sharedViewProps} />
      </main>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        userId={session?.user?.id}
        userEmail={session?.user?.email}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onCancel={() => closeConfirmDialog(false)}
        onConfirm={() => closeConfirmDialog(true)}
      />

      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[210] flex flex-col items-end gap-3 md:inset-x-auto md:right-8 md:bottom-8">
        <AnimatePresence initial={false}>
          {pendingMilestoneDeletes.map((deletion) => (
            <motion.div
              key={deletion.undoId}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-[22px] px-4 py-3 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              style={{ background: "var(--toast-bg)", border: "1px solid var(--toast-border)" }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(251,146,60,0.16),rgba(255,255,255,0.4),rgba(251,146,60,0.16))]" />
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{
                  duration: MILESTONE_DELETE_UNDO_MS / 1000,
                  ease: "linear",
                }}
                className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[linear-gradient(90deg,#fb923c,#f59e0b)]"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-400/16 bg-rose-400/10 text-rose-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Milestone deleted
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                    {deletion.milestone.title} / {deletion.goalTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => undoMilestoneDelete(deletion.undoId)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    border: "1px solid var(--surface-border-strong)",
                    background: "var(--hover-overlay)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Undo
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

            <AnimatePresence>
        <CustomizeDashboardModal
          isCustomizingLayout={isCustomizingLayout}
          setIsCustomizingLayout={setIsCustomizingLayout}
          dashboardLayout={dashboardLayout}
          setDashboardLayout={setDashboardLayout}
        />
      </AnimatePresence>

      <AnimatePresence>
        <GoalModal
          isAddingGoal={isAddingGoal}
          editingGoal={editingGoal}
          onClose={cancelGoalForm}
          handleAddGoal={handleAddGoal}
          newGoal={newGoal}
          setNewGoal={setNewGoal}
          categories={categories}
          isSaving={isSaving}
          saveError={goalSaveError}
        />
        <HabitModal
          isAddingHabit={isAddingHabit}
          setIsAddingHabit={setIsAddingHabit}
          editingHabit={editingHabit}
          setEditingHabit={setEditingHabit}
          handleAddHabit={handleAddHabit}
          handleDeleteHabit={handleDeleteHabit}
          newHabit={newHabit}
          setNewHabit={setNewHabit}
          categories={categories}
          isSaving={isSaving}
          saveError={habitSaveError}
        />
        <MilestoneModal
          isAddingMilestone={isAddingMilestone}
          editingMilestone={editingMilestone}
          closeMilestoneModal={closeMilestoneModal}
          activeGoalId={activeGoalId}
          goals={goals}
          handleSubmitMilestone={handleSubmitMilestone}
          newMilestone={newMilestone}
          setNewMilestone={setNewMilestone}
          isSaving={isSaving}
        />
        <CategoryModal
          isAddingCategory={isAddingCategory}
          setIsAddingCategory={setIsAddingCategory}
          editingCategory={editingCategory}
          setEditingCategory={setEditingCategory}
          handleAddCategory={handleAddCategory}
          handleEditCategory={handleEditCategory}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
        />
      </AnimatePresence>
    </div>
  );
}
