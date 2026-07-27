import React, { useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit2,
  Plus,
  Target,
  Trophy,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  isCompletedOnDate,
  type Category,
  type Goal,
  type Milestone,
} from "../storage";
import { TaskPreviewCard } from "../components/TaskPreviewCard";
import { Card } from "../components/ui/Card";
import { getGoalDeadlineMeta, parseLocalDateValue } from "../lib/goalDeadline";
import { getAccentColor, safeDate } from "../lib/goalInsightsLogic";
import { cn } from "../lib/utils";
import type { ViewType } from "../hooks/useAppRouter";

const PRIORITY_TONES: Record<Goal["priority"], string> = {
  High: "border-rose-400/16 bg-rose-400/[0.09] text-rose-200",
  Medium: "border-amber-400/16 bg-amber-400/[0.09] text-amber-200",
  Low: "border-orange-400/16 bg-orange-400/[0.09] text-orange-200",
};

const FALLBACK_CATEGORY_COLOR = "#7c8798";

const HERO_SURFACE_CLASS = "relative overflow-hidden rounded-xl oryn-surface";
const MILESTONE_COMPLETE_FLIGHT_MS = 420;
const COMPLETED_SECTION_PEEK_MS = 980;

const isValidDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !Number.isNaN(d.getTime());
};

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    window.requestAnimationFrame(() => resolve());
  });

type PreviewMilestone = Milestone & {
  isDone?: boolean;
};

type CompletionFlight = {
  id: string;
  milestone: PreviewMilestone;
  originRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  deltaX: number;
  deltaY: number;
  targetScale: number;
  targetOpacity: number;
};

type GoalDetailViewProps = {
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  setActiveGoalId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAddingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  handleEditGoal: (goal: Goal) => void;
  handleEditMilestone: (milestone: Milestone) => void;
  setMilestoneCompleted: (
    id: string,
    date: string | undefined,
    done: boolean,
  ) => void | Promise<void>;
  deleteMilestone: (id: string) => void | Promise<void>;
  handleDeleteGoal: (id: string) => void | Promise<void>;
  featuredGoalId: string | null;
  setFeaturedGoalId: React.Dispatch<React.SetStateAction<string | null>>;
  categories: Category[];
  pendingMilestoneIds?: Set<string>;
  activeGoal?: Goal;
};

export function GoalDetailView(props: GoalDetailViewProps) {
  const {
    setView,
    setActiveGoalId,
    setIsAddingMilestone,
    handleEditGoal,
    handleEditMilestone,
    setMilestoneCompleted,
    deleteMilestone,
    handleDeleteGoal,
    featuredGoalId,
    setFeaturedGoalId,
    categories,
    pendingMilestoneIds = new Set(),
    activeGoal,
  } = props;
  const [previewMilestone, setPreviewMilestone] =
    useState<PreviewMilestone | null>(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [peekCompleted, setPeekCompleted] = useState(false);
  const [completingMilestoneIds, setCompletingMilestoneIds] = useState<
    Set<string>
  >(new Set());
  const [completionFlights, setCompletionFlights] = useState<CompletionFlight[]>(
    [],
  );
  const [completedBadgePulseKey, setCompletedBadgePulseKey] = useState(0);
  const mountedRef = React.useRef(true);
  const milestoneRowRefs = React.useRef(new Map<string, HTMLDivElement | null>());
  const incompleteMilestoneIdsRef = React.useRef<Set<string>>(new Set());
  const completedDockRef = React.useRef<HTMLDivElement | null>(null);
  const completedHeaderRef = React.useRef<HTMLButtonElement | null>(null);
  const completedExpandedRef = React.useRef(false);
  const handoffTimersRef = React.useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set(),
  );
  const peekTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activeGoal) {
      setActiveGoalId(null);
      setView("goals");
    }
  }, [activeGoal, setActiveGoalId, setView]);

  useEffect(() => {
    completedExpandedRef.current = completedExpanded;
  }, [completedExpanded]);

  const activeCategory = categories.find(
    (category) => category.name === activeGoal?.category,
  );
  const goalAccentColor = activeGoal
    ? getAccentColor(activeGoal, activeCategory?.color || FALLBACK_CATEGORY_COLOR)
    : activeCategory?.color || FALLBACK_CATEGORY_COLOR;
  const categoryLabel =
    activeGoal?.category?.trim() || activeCategory?.name || "Uncategorized";
  const goalNote = activeGoal?.note?.trim();
  const isFeaturedGoal = activeGoal ? featuredGoalId === activeGoal.id : false;
  const deadlineMeta = getGoalDeadlineMeta({
    deadline: activeGoal?.deadline,
    progress: activeGoal?.progress,
  });
  const projectedCompletion = useMemo(() => {
    if (!activeGoal || activeGoal.progress >= 100) return null;
    if (!activeGoal.created_at) return null;

    const daysSinceStart = differenceInCalendarDays(
      startOfDay(new Date()),
      startOfDay(parseISO(activeGoal.created_at)),
    );
    if (daysSinceStart < 1) return null;

    const progressPerDay = activeGoal.progress / daysSinceStart;
    if (progressPerDay <= 0) return null;

    const remainingProgress = 100 - activeGoal.progress;
    const daysToFinish = Math.ceil(remainingProgress / progressPerDay);
    const projectedDate = addDays(new Date(), daysToFinish);

    const isAfterDeadline = activeGoal.deadline
      ? isAfter(projectedDate, parseISO(activeGoal.deadline))
      : false;

    return {
      date: projectedDate,
      dateFormatted: format(projectedDate, "MMM d, yyyy"),
      daysFromNow: daysToFinish,
      isAfterDeadline,
      progressPerDay: parseFloat(progressPerDay.toFixed(1)),
    };
  }, [activeGoal]);

  const paceAnalysis = useMemo(() => {
    if (!activeGoal || activeGoal.progress >= 100) return null;
    if (!activeGoal.deadline || !activeGoal.created_at) return null;

    const today = startOfDay(new Date());
    const deadlineDate = startOfDay(parseISO(activeGoal.deadline));
    const createdDate = startOfDay(parseISO(activeGoal.created_at));

    const daysLeft = differenceInCalendarDays(deadlineDate, today);
    const daysSinceStart = differenceInCalendarDays(today, createdDate);

    if (daysLeft <= 0 || daysSinceStart < 1) return null;

    const actualDailyRate = parseFloat(
      (activeGoal.progress / daysSinceStart).toFixed(1),
    );
    const requiredDailyRate = parseFloat(
      ((100 - activeGoal.progress) / daysLeft).toFixed(1),
    );
    const isOnPace = actualDailyRate >= requiredDailyRate;
    const gap = parseFloat(
      (actualDailyRate - requiredDailyRate).toFixed(1),
    );

    return {
      actualDailyRate,
      requiredDailyRate,
      isOnPace,
      gap,
    };
  }, [activeGoal]);

  const milestoneVelocity = useMemo(() => {
    if (!activeGoal) return null;
    const completedMilestones = (activeGoal.milestones || [])
      .filter((m) => m.completed_at);
    if (completedMilestones.length === 0) return null;

    const today = startOfDay(new Date());
    const last7Start = subDays(today, 7);
    const prev7Start = subDays(today, 14);

    const last7Count = completedMilestones.filter((m) => {
      const d = safeDate(m.completed_at);
      return d && isAfter(d, last7Start) && !isAfter(d, today);
    }).length;

    const prev7Count = completedMilestones.filter((m) => {
      const d = safeDate(m.completed_at);
      return d && isAfter(d, prev7Start) && !isAfter(d, last7Start);
    }).length;

    const delta = last7Count - prev7Count;
    const isImproving = delta > 0;
    const isSame = delta === 0;

    return { last7Count, prev7Count, delta, isImproving, isSame };
  }, [activeGoal]);

  const goalDeadlineDate = parseLocalDateValue(activeGoal?.deadline);
  const goalStatusLabel = activeGoal
    ? activeGoal.progress >= 100
      ? "Completed"
      : deadlineMeta.isOverdue
        ? "Overdue"
        : deadlineMeta.isDueSoon
          ? "Due Soon"
      : "In Progress"
    : "In Progress";

  const milestones = activeGoal?.milestones || [];
  const milestonesWithState: PreviewMilestone[] = milestones.map((milestone) => ({
    ...milestone,
    isDone:
      milestone.repeat && milestone.repeat !== "None"
        ? isCompletedOnDate(milestone, new Date())
        : milestone.done === true,
  }));
  const incompleteMilestones = milestonesWithState.filter((ms) => !ms.isDone);
  const completedMilestones = milestonesWithState.filter((ms) => ms.isDone);
  const isCompletedSectionOpen = completedExpanded;

  const registerHandoffTimer = React.useCallback(
    (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        handoffTimersRef.current.delete(timer);
        callback();
      }, delay);
      handoffTimersRef.current.add(timer);
      return timer;
    },
    [],
  );

  const clearCompletedPeekTimer = React.useCallback(() => {
    if (peekTimerRef.current) {
      clearTimeout(peekTimerRef.current);
      handoffTimersRef.current.delete(peekTimerRef.current);
      peekTimerRef.current = null;
    }
  }, []);

  const clearAllHandoffTimers = React.useCallback(() => {
    handoffTimersRef.current.forEach((timer) => clearTimeout(timer));
    handoffTimersRef.current.clear();
    peekTimerRef.current = null;
  }, []);

  const pulseCompletedSection = React.useCallback(() => {
    setCompletedBadgePulseKey((prev) => prev + 1);
  }, []);

  const peekCompletedSection = React.useCallback(() => {
    if (completedExpandedRef.current) return;

    clearCompletedPeekTimer();
    setPeekCompleted(true);

    const timer = registerHandoffTimer(() => {
      if (!mountedRef.current || completedExpandedRef.current) return;
      setPeekCompleted(false);
    }, COMPLETED_SECTION_PEEK_MS);

    peekTimerRef.current = timer;
  }, [clearCompletedPeekTimer, registerHandoffTimer]);

  const removeCompletionFlight = React.useCallback((flightId: string) => {
    setCompletionFlights((prev) =>
      prev.filter((flight) => flight.id !== flightId),
    );
  }, []);

  const waitForMilestoneToLeaveActiveList = React.useCallback(
    async (milestoneId: string) => {
      await waitForNextPaint();
      if (!mountedRef.current) return false;
      if (!incompleteMilestoneIdsRef.current.has(milestoneId)) return true;

      await waitForNextPaint();
      return mountedRef.current && !incompleteMilestoneIdsRef.current.has(milestoneId);
    },
    [],
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearAllHandoffTimers();
    };
  }, [clearAllHandoffTimers]);

  useEffect(() => {
    setCompletedExpanded(false);
    setPeekCompleted(false);
    setCompletingMilestoneIds(new Set());
    setCompletionFlights([]);
    clearCompletedPeekTimer();
    clearAllHandoffTimers();
  }, [activeGoal?.id]);

  useEffect(() => {
    incompleteMilestoneIdsRef.current = new Set(
      incompleteMilestones.map((milestone) => milestone.id),
    );
  }, [incompleteMilestones]);

  if (!activeGoal) {
    return null;
  }

  const handleActiveMilestoneComplete = async (milestone: PreviewMilestone) => {
    if (pendingMilestoneIds.has(milestone.id)) return;
    await setMilestoneCompleted(milestone.id, undefined, true);
  };

  const handleCompletedMilestoneRestore = async (milestone: PreviewMilestone) => {
    if (pendingMilestoneIds.has(milestone.id)) return;
    await setMilestoneCompleted(milestone.id, undefined, false);
  };

  const setMilestoneRowRef = (milestoneId: string) => (node: HTMLDivElement | null) => {
    if (node) {
      milestoneRowRefs.current.set(milestoneId, node);
    } else {
      milestoneRowRefs.current.delete(milestoneId);
    }
  };

  const handleCompletedToggle = () => {
    setCompletedExpanded((prev) => !prev);
  };

  const renderMilestoneRow = (
    milestone: PreviewMilestone,
    location: "active" | "completed",
  ) => {
    const isDone = milestone.isDone === true;
    const isInteractionLocked = pendingMilestoneIds.has(milestone.id);
    const isCompletedRow = location === "completed";

    if (isCompletedRow) {
      const dueText =
        milestone.due_date && isValidDate(milestone.due_date)
          ? `Due ${format(new Date(milestone.due_date), "MMM d")}`
          : null;

      return (
        <motion.div
          key={`${location}:${milestone.id}`}
          layout
          initial={false}
          animate={{
            scale: 1,
            x: 0,
            y: 0,
            opacity: isInteractionLocked ? 0.76 : 1,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
          }}
          exit={{
            opacity: 0,
            y: -8,
            scale: 0.97,
            transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
          }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "relative w-full overflow-hidden rounded-xl oryn-surface px-3.5 py-3 transition-colors duration-200",
            isInteractionLocked && "ring-1 ring-orange-400/20",
          )}
          style={{
            background: "var(--surface)",
            borderColor: "rgba(251,146,60,0.16)",
            boxShadow: "var(--surface-shadow)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--completed-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
        >
          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewMilestone(milestone)}
            disabled={isInteractionLocked}
            className="min-w-0 flex-1 text-left disabled:cursor-wait"
            aria-label={`Preview ${milestone.title}`}
          >
            <p
              className="truncate text-[14px] font-medium line-through"
              style={{ color: "var(--text-secondary)" }}
            >
              {milestone.title}
            </p>
            <p className="truncate text-[11px]" style={{ color: "var(--text-faint)" }}>
              {dueText || "Completed"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => void handleCompletedMilestoneRestore(milestone)}
            disabled={isInteractionLocked}
            className="min-w-[58px] shrink-0 rounded-full px-2.5 py-1 text-center text-[11px] font-semibold disabled:cursor-wait disabled:opacity-55"
            style={{
              border: "1px solid var(--completed-reopen-border)",
              background: "var(--completed-reopen-bg)",
              color: "var(--completed-reopen-text)",
            }}
            aria-label={`Reopen ${milestone.title}`}
          >
            {isInteractionLocked ? "Saving" : "Reopen"}
          </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={`${location}:${milestone.id}`}
        ref={location === "active" ? setMilestoneRowRef(milestone.id) : undefined}
        layout
        initial={false}
        animate={{
          scale: 1,
          x: 0,
          y: 0,
          opacity: isInteractionLocked ? 0.76 : isDone ? 0.6 : 1,
          boxShadow: "0 0 0 rgba(0,0,0,0)",
        }}
        exit={{
          opacity: 0,
          y: -8,
          scale: 0.97,
          transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
        }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative overflow-hidden rounded-xl oryn-surface px-3.5 py-3 transition-opacity duration-200",
          isInteractionLocked && "ring-1 ring-orange-400/20",
        )}
        style={isDone ? { background: "var(--hover-overlay)", borderColor: "rgba(251,146,60,0.24)" } : undefined}
      >
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewMilestone(milestone)}
            disabled={isInteractionLocked}
            className="relative z-[1] min-w-0 flex-1 text-left disabled:cursor-wait"
            aria-label={`Preview ${milestone.title}`}
          >
            <h5
              className={cn(
                "truncate text-[16px] font-semibold leading-tight tracking-[-0.01em]",
                isDone ? "line-through" : "",
              )}
              style={{ color: isDone ? "var(--text-secondary)" : "var(--text-primary)" }}
            >
              {milestone.title}
            </h5>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              {milestone.due_date && isValidDate(milestone.due_date) && (
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                  Due {format(new Date(milestone.due_date), "MMM d")}
                </p>
              )}
              {milestone.repeat && milestone.repeat !== "None" && (
                <span className="shrink-0 rounded bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                  Repeats {milestone.repeat}
                </span>
              )}
              {isInteractionLocked && (
                <span className="shrink-0 rounded bg-orange-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                  Updating
                </span>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void (location === "active"
                ? handleActiveMilestoneComplete(milestone)
                : handleCompletedMilestoneRestore(milestone));
            }}
            disabled={isInteractionLocked}
            className="flex h-9 min-w-[68px] shrink-0 items-center justify-center rounded-full px-3.5 text-[12px] font-semibold tracking-[-0.01em] transition-colors disabled:cursor-wait disabled:opacity-55"
            style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
            aria-label={isDone ? `Reopen ${milestone.title}` : `Complete ${milestone.title}`}
          >
            <span>{isInteractionLocked ? "Saving" : (isDone ? "Reopen" : "Done")}</span>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-6xl p-4 md:p-8"
    >

          <button
            onClick={() => setView("goals")}
            className="mb-5 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all"
            style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Goals</span>
          </button>

          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
            <div className="min-w-0 space-y-8">
              <header className={HERO_SURFACE_CLASS}>
                <div
                  className="pointer-events-none absolute inset-0 opacity-90"
                  style={{
                    background: `radial-gradient(circle at 84% 12%, ${goalAccentColor}22 0%, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 56%)`,
                  }}
                />
                <div className="relative p-6 md:p-7">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: goalAccentColor }}
                      />
                      {categoryLabel}
                    </div>
                    <div
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]",
                        PRIORITY_TONES[activeGoal.priority],
                      )}
                    >
                      {activeGoal.priority} Priority
                    </div>
                    <button
                      onClick={() => setFeaturedGoalId(activeGoal.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all",
                        isFeaturedGoal
                          ? "border-sky-400/18 bg-sky-400/[0.12] text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "",
                      )}
                      style={isFeaturedGoal ? undefined : { borderColor: "var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
                    >
                      <Target className="h-3.5 w-3.5" />
                      {isFeaturedGoal ? "Featured Goal" : "Make Featured Goal"}
                    </button>
                  </div>

                  <div className="mt-7">
                    <h2 className="max-w-3xl text-[42px] font-semibold leading-[0.94] tracking-[-0.065em] md:text-[56px]" style={{ color: "var(--text-primary)" }}>
                      {activeGoal.title}
                    </h2>

                    {goalNote && (
                      <p className="mt-4 max-w-2xl text-[15px] font-medium leading-7 md:text-[16px]" style={{ color: "var(--text-secondary)" }}>
                        {goalNote}
                      </p>
                    )}
                  </div>
                </div>
              </header>

              {(!activeGoal.repeat || activeGoal.repeat === "None") && (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Milestones
                    </h3>
                    <button
                      onClick={() => setIsAddingMilestone(true)}
                      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-orange-500 drop-shadow-[0_0_8px_rgba(255,87,34,0.6)] transition-colors hover:text-orange-400"
                    >
                      <Plus className="h-4 w-4" />
                      Add Milestone
                    </button>
                  </div>

                  <div className="space-y-3">
                    {milestones.length === 0 ? (
                      <div className="rounded-xl border border-dashed py-12 text-center" style={{ borderColor: "var(--divider)", background: "var(--stat-cell-bg)" }}>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                          No milestones yet. Break down your goal into smaller
                          steps.
                        </p>
                      </div>
                    ) : incompleteMilestones.length === 0 ? (
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-4">
                        <p className="text-sm font-semibold text-emerald-200">
                          All milestones are completed.
                        </p>
                        <p className="mt-1 text-xs text-emerald-100/70">
                          Completed milestones are tucked below. Tap one to reopen it.
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence initial={false} mode="popLayout">
                        {incompleteMilestones.map((milestone) =>
                          renderMilestoneRow(milestone, "active"),
                        )}
                      </AnimatePresence>
                    )}

                    <div
                      ref={completedDockRef}
                      className={cn(
                        "relative",
                        completedMilestones.length === 0 && "min-h-[10px]",
                      )}
                    >
                      <AnimatePresence initial={false}>
                        {completedMilestones.length > 0 && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.985 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.985 }}
                          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden rounded-xl"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--surface-border)",
                            boxShadow: "var(--surface-shadow)",
                          }}
                        >
                          <motion.button
                            ref={completedHeaderRef}
                            type="button"
                            layout
                            onClick={handleCompletedToggle}
                            className="flex min-h-[60px] w-full items-center justify-between px-4 py-3.5 text-left transition-colors"
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-overlay)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                          >
                            <div className="flex items-center gap-3">
                              <motion.div
                                key={`completed-icon-${completedBadgePulseKey}`}
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.07, 1] }}
                                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-300/16 bg-amber-400/[0.08] text-amber-300"
                              >
                                <Trophy className="h-4 w-4" />
                              </motion.div>
                              <div>
                                <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                                  Completed Milestones
                                </p>
                                <p className="mt-0.5 text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
                                  Tap a checked milestone to reopen it
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.span
                                key={`completed-badge-${completedMilestones.length}-${completedBadgePulseKey}`}
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.16, 1] }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="rounded-full border border-amber-300/12 bg-amber-400/[0.08] px-2.5 py-1 text-[12px] font-semibold text-amber-200 tabular-nums"
                              >
                                {completedMilestones.length}
                              </motion.span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  completedExpanded && "rotate-180",
                                )}
                                style={{ color: "var(--text-faint)" }}
                              />
                            </div>
                          </motion.button>

                          <AnimatePresence initial={false}>
                            {isCompletedSectionOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-2 p-3" style={{ borderTop: "1px solid var(--divider)" }}>
                                  <AnimatePresence initial={false} mode="popLayout">
                                    {completedMilestones.map((milestone) =>
                                      renderMilestoneRow(milestone, "completed"),
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full space-y-6 lg:pt-1">
              <Card className="p-8 text-center">
                <div className="relative mb-6 inline-block">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      style={{ color: "var(--text-faint)" }}
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={364.4}
                      initial={{ strokeDashoffset: 364.4 }}
                      animate={{
                        strokeDashoffset:
                          364.4 - (364.4 * activeGoal.progress) / 100,
                      }}
                      className="text-orange-500 drop-shadow-[0_0_8px_rgba(255,87,34,0.6)]"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-black" style={{ color: "var(--text-primary)" }}>
                      {activeGoal.progress}%
                    </span>
                    <span className="text-[9px] font-semibold tracking-widest uppercase uppercase" style={{ color: "var(--text-muted)" }}>
                      Done
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Status
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        goalStatusLabel === "Completed"
                          ? "text-orange-500 drop-shadow-[0_0_8px_rgba(255,87,34,0.6)]"
                          : goalStatusLabel === "Overdue"
                            ? "text-rose-400"
                            : goalStatusLabel === "Due Soon"
                              ? "text-amber-300"
                              : "text-sky-300",
                      )}
                    >
                      {goalStatusLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Deadline
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        deadlineMeta.isOverdue
                          ? "text-rose-400"
                          : deadlineMeta.isDueSoon
                            ? "text-amber-300"
                            : "",
                      )}
                      style={deadlineMeta.isOverdue || deadlineMeta.isDueSoon ? undefined : { color: "var(--text-primary)" }}
                    >
                      {goalDeadlineDate
                        ? format(goalDeadlineDate, "MMM d, yyyy")
                        : "None"}
                    </span>
                  </div>
                  {projectedCompletion && (
                    <div className="flex justify-between text-xs">
                      <span className="font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-muted)" }}>
                        At this pace
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          projectedCompletion.isAfterDeadline ? "text-rose-400" : "text-emerald-400"
                        )}
                      >
                        {projectedCompletion.dateFormatted}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-8 border-t pt-8" style={{ borderColor: "var(--divider)" }}>
                  <button
                    type="button"
                    onClick={() => handleEditGoal(activeGoal)}
                    className="mb-3 w-full rounded-xl py-3 text-[10px] font-semibold uppercase tracking-widest transition-colors"
                    style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
                  >
                    Edit Goal
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(activeGoal.id)}
                    className="w-full rounded-xl border border-rose-500/20 py-3 text-[10px] font-semibold uppercase tracking-widest text-rose-500 transition-colors hover:bg-rose-500/10"
                  >
                    Delete Goal
                  </button>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="mb-4 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Insights
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                      <TrendingUp className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-primary)" }}>
                        Momentum
                      </p>
                      <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {activeGoal.progress > 50
                          ? "You're past the halfway mark! Keep the momentum going."
                          : "Early stages. Consistency is key right now."}
                      </p>
                    </div>
                  </div>
                  {paceAnalysis && (
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: paceAnalysis.isOnPace
                          ? "rgba(52,211,153,0.1)"
                          : "rgba(251,113,133,0.1)" }}>
                        {paceAnalysis.isOnPace
                          ? <TrendingUp className="h-5 w-5 text-emerald-400" />
                          : <TrendingDown className="h-5 w-5 text-rose-400" />
                        }
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: "var(--text-primary)" }}>
                          Daily Pace
                        </p>
                        <p className="text-[10px] leading-relaxed"
                          style={{ color: "var(--text-muted)" }}>
                          Doing <span className="font-semibold"
                            style={{ color: "var(--text-primary)" }}>
                            {paceAnalysis.actualDailyRate}%/day
                          </span>
                          {" "}— need{" "}
                          <span className={cn(
                            "font-semibold",
                            paceAnalysis.isOnPace ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {paceAnalysis.requiredDailyRate}%/day
                          </span>
                          {" "}to finish on time.
                          {paceAnalysis.isOnPace
                            ? ` Ahead by ${paceAnalysis.gap}%/day.`
                            : ` Behind by ${Math.abs(paceAnalysis.gap)}%/day.`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  {milestoneVelocity && milestoneVelocity.last7Count > 0 && (
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                        <Zap className="h-5 w-5 text-sky-400" />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: "var(--text-primary)" }}>
                          Velocity
                        </p>
                        <p className="text-[10px] leading-relaxed"
                          style={{ color: "var(--text-muted)" }}>
                          <span className="font-semibold"
                            style={{ color: "var(--text-primary)" }}>
                            {milestoneVelocity.last7Count} milestone
                            {milestoneVelocity.last7Count !== 1 ? "s" : ""}
                          </span>
                          {" "}completed this week
                          {milestoneVelocity.prev7Count > 0 && (
                            milestoneVelocity.isSame
                              ? " — same as last week."
                              : milestoneVelocity.isImproving
                                ? <span className="text-emerald-400">
                                    {" "}— {milestoneVelocity.delta} more than last week ↑
                                  </span>
                                : <span className="text-rose-400">
                                    {" "}— {Math.abs(milestoneVelocity.delta)} fewer than last week ↓
                                  </span>
                          )}
                          {milestoneVelocity.prev7Count === 0 && "."}
                        </p>
                      </div>
                    </div>
                  )}
                  {!deadlineMeta.isCompleted && deadlineMeta.isOverdue && (
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                          <Clock className="h-5 w-5 text-rose-400" />
                        </div>
                        <div>
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-rose-400">
                            Overdue
                          </p>
                          <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            The target date passed {Math.abs(deadlineMeta.daysLeft || 0)} day
                            {Math.abs(deadlineMeta.daysLeft || 0) === 1 ? "" : "s"} ago.
                            Update the timeline or close the remaining milestones.
                          </p>
                        </div>
                      </div>
                    )}
                  {!deadlineMeta.isCompleted &&
                    !deadlineMeta.isOverdue &&
                    deadlineMeta.isDueSoon && (
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                          <Clock className="h-5 w-5 text-amber-300" />
                        </div>
                        <div>
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                            {deadlineMeta.isDueToday
                              ? "Due Today"
                              : deadlineMeta.isDueTomorrow
                                ? "Due Tomorrow"
                                : "Deadline Near"}
                          </p>
                          <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {deadlineMeta.isDueToday
                              ? "This goal is due today. Focus on the remaining milestones now."
                              : deadlineMeta.isDueTomorrow
                                ? "This goal is due tomorrow. Try to finish the remaining work today."
                                : `This goal is due in ${deadlineMeta.daysLeft} days. Keep the remaining milestones moving.`}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </Card>
            </div>
          </div>

      <TaskPreviewCard
        open={Boolean(previewMilestone)}
        onClose={() => setPreviewMilestone(null)}
        title={previewMilestone?.title || ""}
        subtitle={activeGoal?.title || "Milestone"}
        accentColor={goalAccentColor}
        metadata={[
          {
            label: "Due",
            value:
              previewMilestone?.due_date &&
              isValidDate(previewMilestone.due_date)
                ? format(new Date(previewMilestone.due_date), "MMM d, yyyy")
                : undefined,
            icon: "calendar",
          },
          {
            label: "Repeat",
            value:
              previewMilestone?.repeat &&
              previewMilestone.repeat !== "None"
                ? previewMilestone.repeat
                : undefined,
            icon: "repeat",
          },
          {
            label: "Status",
            value: previewMilestone
              ? previewMilestone.isDone
                ? "Completed"
                : "Open"
              : undefined,
            icon: "status",
          },
        ]}
        onEdit={() => previewMilestone && handleEditMilestone(previewMilestone)}
        onDelete={() => previewMilestone && deleteMilestone(previewMilestone.id)}
      />
    </motion.div>
  );
}
