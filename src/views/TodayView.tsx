import React from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Flame,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { TaskPreviewCard } from "../components/TaskPreviewCard";
import { cn } from "../lib/utils";
import type { ViewType } from "../hooks/useAppRouter";
import type { CalendarItemWithState } from "../types/calendar";

type TodayTask = CalendarItemWithState & {
  __placeholder?: boolean;
};

type TodayViewProps = {
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleArenaComplete: (
    task: TodayTask,
    event: React.MouseEvent<HTMLElement>,
  ) => void | Promise<void>;
  handleToggleToday: (task: TodayTask, done: boolean) => void | Promise<void>;
  getItemsForDate: (date: Date) => TodayTask[];
  isFocusMode: boolean;
  todayMilestones?: TodayTask[];
  todayProgress?: number;
  yesterdayProgress?: number | null;
  todayCompletedCount?: number;
  todayTotalCount?: number;
  pendingTodayTaskKeys?: Set<string>;
  getTodayTaskKey?: (task: TodayTask, date?: Date) => string;
  completedExpanded: boolean;
  setCompletedExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  showBreather: boolean;
  breatherMessage: string;
  lastCompleted: string | null;
  breatherTimeout: ReturnType<typeof setTimeout> | null;
  setBreatherTimeout: React.Dispatch<
    React.SetStateAction<ReturnType<typeof setTimeout> | null>
  >;
  setShowBreather: React.Dispatch<React.SetStateAction<boolean>>;
};

const ACCENT = "#34d399";
const ACCENT_DEEP = "#0f766e";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TodayView(props: TodayViewProps) {
  const {
    setView,
    setIsFocusMode,
    handleArenaComplete,
    handleToggleToday,
    getItemsForDate,
    isFocusMode,
    todayMilestones = [],
    todayProgress = 0,
    yesterdayProgress = null,
    todayCompletedCount = 0,
    todayTotalCount = 0,
    pendingTodayTaskKeys = new Set(),
    getTodayTaskKey,
    completedExpanded,
    setCompletedExpanded,
    showBreather,
    breatherMessage,
    lastCompleted,
    breatherTimeout,
    setBreatherTimeout,
    setShowBreather,
  } = props;

  const today = new Date();
  const incompleteTasks = todayMilestones.filter((task) => !task.done);
  const completedTasks = todayMilestones.filter((task) => task.done);
  const visibleTasks = incompleteTasks;
  const [previewTask, setPreviewTask] = React.useState<TodayTask | null>(null);
  const remainingCount = Math.max(todayTotalCount - todayCompletedCount, 0);
  const focusTask = incompleteTasks[0];
  const focusTaskSaving = Boolean(
    focusTask &&
      getTodayTaskKey &&
      pendingTodayTaskKeys.has(getTodayTaskKey(focusTask)),
  );

  const weekStats = React.useMemo(() => {
    return [...Array(7)].map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - index));
      const items = getItemsForDate(day);
      const done = items.filter((item) => item.done).length;
      const total = items.length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);
      return {
        day,
        progress,
        label: format(day, "EEEEE"),
      };
    });
  }, [getItemsForDate]);

  const weeklyChart = {
    width: 320,
    height: 170,
    baseline: 128,
    labelY: 154,
    minBarHeight: 38,
    maxBarHeight: 112,
    left: 23,
    step: 45.6,
  };

  const momentumPoints = weekStats.map((day, index) => {
    const visualHeight =
      weeklyChart.minBarHeight +
      (day.progress / 100) * (weeklyChart.maxBarHeight - weeklyChart.minBarHeight);
    const x = weeklyChart.left + index * weeklyChart.step;
    const y = weeklyChart.baseline - visualHeight;
    return { ...day, visualHeight, x, y };
  });

  const momentumPath = momentumPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const TaskIcon = ({
    color = ACCENT,
    isHabit = false,
  }: {
    color?: string;
    isHabit?: boolean;
  }) => (
    <div
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[15px] border"
      style={{
        background: "var(--task-badge-bg)",
        borderColor: hexToRgba(color, 0.28),
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.055), 0 0 20px ${hexToRgba(color, 0.12)}`,
      }}
    >
      <div className="absolute inset-1 rounded-[12px]" style={{ background: "var(--hover-overlay)" }} />
      {isHabit ? (
        <Flame className="relative h-3.5 w-3.5" style={{ color }} />
      ) : (
        <Target className="relative h-3.5 w-3.5" style={{ color }} />
      )}
    </div>
  );

  const PremiumSurface = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={cn("relative overflow-hidden rounded-xl", className)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface-border)",
        boxShadow: "var(--surface-shadow)",
      }}
    >
      {children}
    </div>
  );

  const HeroCard = () => (
    <PremiumSurface className="p-4">
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="whitespace-nowrap text-[25px] font-semibold leading-none tracking-[-0.02em] tabular-nums" style={{ color: "var(--text-primary)" }}>
            {todayCompletedCount}/{todayTotalCount} <span className="text-[18px] font-medium" style={{ color: "var(--text-secondary)" }}>complete</span>
          </h1>
          <p className="mt-2 max-w-[170px] text-[13px] font-medium leading-snug" style={{ color: "var(--text-muted)" }}>
            {remainingCount} remaining
            {yesterdayProgress !== null ? (
              <>
                {" \u00b7 "}
                {todayProgress > yesterdayProgress ? (
                  <span><span className="text-emerald-400 font-bold">{"\u2191"}</span> Ahead of yesterday</span>
                ) : todayProgress < yesterdayProgress ? (
                  <span><span className="text-rose-400 font-bold">{"\u2193"}</span> Behind yesterday</span>
                ) : (
                  <span>{`\u2014`} Same as yesterday</span>
                )}
              </>
            ) : null}
          </p>
        </div>

        <div className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center">
          <div className="absolute inset-3 rounded-full bg-emerald-400/8 blur-xl" />
          <svg className="relative h-full w-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="18"
            />
            <circle
              cx="64"
              cy="64"
              r="48"
              fill="none"
              stroke="url(#todayRing)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={301.59}
              strokeDashoffset={301.59 - (301.59 * todayProgress) / 100}
              style={{ filter: "drop-shadow(0 0 10px rgba(52,211,153,0.35))" }}
            />
            <defs>
              <linearGradient id="todayRing" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#d1fae5" />
                <stop offset="0.42" stopColor={ACCENT} />
                <stop offset="1" stopColor={ACCENT_DEEP} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-semibold tabular-nums ${
                Math.round(todayProgress) >= 100
                  ? "text-[16px] tracking-[-0.01em]"
                  : "text-[21px] tracking-[-0.02em]"
              }`}
              style={{ color: "var(--text-primary)" }}
            >
              {Math.round(todayProgress)}%
            </span>
          </div>
        </div>
      </div>
    </PremiumSurface>
  );

  const MomentumCard = () => (
    <PremiumSurface className="p-4">
      <div className="relative h-[190px]">
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${weeklyChart.width} ${weeklyChart.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="momentumBar"
              x1="0"
              y1={weeklyChart.baseline}
              x2="0"
              y2="16"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#059669" />
              <stop offset="0.55" stopColor={ACCENT} />
              <stop offset="1" stopColor="#a7f3d0" />
            </linearGradient>
            <style>{`
              .chart-bar-inactive { stroke: var(--chart-bar-inactive); }
              .chart-label { fill: var(--chart-label-fill); }
              .chart-line { stroke: var(--chart-line); }
            `}</style>
          </defs>
          <path
            d={momentumPath}
            fill="none"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chart-line"
          />
          {momentumPoints.map((day, index) => {
            const isHighlight = index >= 5 || day.progress >= 80;
            return (
              <React.Fragment key={day.day.toISOString()}>
                <line
                  x1={day.x}
                  x2={day.x}
                  y1={weeklyChart.baseline}
                  y2={weeklyChart.baseline - day.visualHeight}
                  stroke={isHighlight ? "url(#momentumBar)" : undefined}
                  strokeWidth="16"
                  strokeLinecap="round"
                  className={isHighlight ? undefined : "chart-bar-inactive"}
                  style={{
                    filter: isHighlight
                      ? "drop-shadow(0 0 14px rgba(52,211,153,0.36))"
                      : undefined,
                  }}
                />
                <text
                  x={day.x}
                  y={weeklyChart.labelY}
                  textAnchor="middle"
                  className="chart-label text-[10px] font-semibold"
                >
                  {day.label}
                </text>
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    </PremiumSurface>
  );

  const FocusTaskCard = ({
    task,
    index,
  }: {
    task: TodayTask;
    index: number;
    key?: React.Key;
  }) => {
    const isHabit = Boolean(task.isHabit);
    const color = task.categoryColor || (isHabit ? ACCENT : "#2dd4bf");
    const title = task.title || "Untitled task";
    const metadata = isHabit
      ? `Habit streak: ${task.streak || 9} days`
      : [task.goalTitle, task.category].filter(Boolean).join(" · ") || "General Tasks";
    const metadataAccent = isHabit ? ACCENT : color;
    const isSaving = Boolean(
      getTodayTaskKey && pendingTodayTaskKeys.has(getTodayTaskKey(task)),
    );

    return (
      <motion.div
        layout
        whileTap={isSaving ? undefined : { scale: 0.992 }}
        className={cn("relative overflow-hidden rounded-xl px-3.5 py-3 transition-opacity", isSaving && "opacity-75")}
        style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "var(--surface-shadow)" }}
      >
        <div
          className="absolute -left-10 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full blur-2xl"
          style={{ backgroundColor: hexToRgba(color, 0.02) }}
        />
        <div className="relative flex items-center gap-3">
          <TaskIcon color={color} isHabit={isHabit} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => !task.__placeholder && setPreviewTask(task)}
                disabled={Boolean(task.__placeholder)}
                className="min-w-0 flex-1 text-left disabled:cursor-default"
                aria-label={`Preview ${title}`}
              >
                <h3 className="truncate text-[16px] font-semibold leading-tight tracking-[-0.01em]" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h3>
                <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: metadataAccent }}
                  />
                  <span className="truncate">{metadata}</span>
                </p>
              </button>
              <button
                type="button"
                onClick={(event) => handleArenaComplete(task, event)}
                disabled={Boolean(task.__placeholder) || isSaving}
                className="flex h-9 min-w-[68px] shrink-0 items-center justify-center rounded-full px-3.5 text-[12px] font-semibold tracking-[-0.01em] transition-colors disabled:cursor-wait disabled:opacity-55"
                style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
                aria-label={`Complete ${title}`}
              >
                <span>{isSaving ? "Saving" : "Done"}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const FocusEmptyState = () => {
    const isComplete = todayTotalCount > 0 && remainingCount === 0;
    const Icon = isComplete ? Trophy : CheckCircle2;

    return (
      <div className="relative overflow-hidden rounded-xl px-4 py-4" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "var(--surface-shadow)" }}>
        <div className="absolute -left-10 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-emerald-400/[0.035] blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-emerald-300/18 bg-emerald-400/[0.08] text-emerald-200 shadow-[0_0_28px_rgba(52,211,153,0.12)]">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-semibold leading-tight tracking-[-0.01em]" style={{ color: "var(--text-primary)" }}>
              {isComplete ? "All done for today" : "Nothing scheduled today"}
            </h3>
            <p className="mt-1 text-[12px] font-medium leading-snug" style={{ color: "var(--text-muted)" }}>
              {isComplete
                ? "Every focus task is complete. Nice work."
                : "Add something from the planner when you want a target."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      key="today"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen w-full overflow-x-hidden px-4 pb-56 pt-5 md:px-10 md:pb-10 md:pt-8"
      style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--page-overlay)" }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44" style={{ background: "var(--page-radial)" }} />

      <AnimatePresence>
        {isFocusMode && focusTask ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 backdrop-blur-xl"
            style={{ background: "var(--focus-overlay-bg)" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(52,211,153,0.14),transparent_35%)]" />
            <button
              onClick={() => setIsFocusMode(false)}
              className="absolute right-6 top-8 rounded-full p-4 transition-colors"
              style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative w-full max-w-md text-center">
              <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-[24px] border border-emerald-300/16 bg-emerald-400/[0.07] text-emerald-200 shadow-[0_0_48px_rgba(52,211,153,0.16)]">
                <Zap className="h-7 w-7" />
              </div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                Continue focus
              </p>
              <h2 className="text-4xl font-semibold tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>
                {focusTask.title}
              </h2>
              <p className="mt-4 text-[15px] font-medium" style={{ color: "var(--text-muted)" }}>
                {[focusTask.goalTitle, focusTask.category].filter(Boolean).join(" · ") || "General Tasks"}
              </p>
              <button
                onClick={(event) => {
                  handleArenaComplete(focusTask, event);
                  setIsFocusMode(false);
                }}
                disabled={focusTaskSaving}
                className="mt-10 h-14 w-full rounded-full border border-emerald-300/20 bg-emerald-400/[0.08] text-[16px] font-semibold text-emerald-100 shadow-[0_18px_42px_-32px_rgba(52,211,153,1)] transition-colors hover:bg-emerald-400/[0.12] disabled:cursor-wait disabled:opacity-60"
              >
                {focusTaskSaving ? "Saving" : "Complete focus"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative mx-auto w-full max-w-[430px] md:max-w-none md:grid md:grid-cols-[430px_minmax(0,1fr)] md:items-start md:gap-6 xl:grid-cols-[460px_minmax(0,1fr)]"><div className="flex flex-col gap-5">
        <MomentumCard />
        <HeroCard />

        <section className="mt-1">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[17px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Focus</h2>
            <span className="text-[13px] font-medium" style={{ color: "var(--text-faint)" }}>
              {remainingCount} open
            </span>
          </div>
          <div className="space-y-2.5">
            {visibleTasks.length > 0 ? (
              visibleTasks.map((task, index: number) => (
                <FocusTaskCard key={task.id || index} task={task} index={index} />
              ))
            ) : (
              <FocusEmptyState />
            )}
          </div>
        </section>

        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() => setView("planner")}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-colors"
          style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "var(--surface-shadow)", color: "var(--text-secondary)" }}
        >
          <span>More for today</span>
          <ChevronRight className="h-4 w-4" />
        </motion.button>

        <div className="overflow-hidden rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "var(--surface-shadow)" }}>
          <button
            type="button"
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex min-h-[60px] w-full items-center justify-between px-4 py-3.5 text-left transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-overlay)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-300/16 bg-amber-400/[0.08] text-amber-300">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Completed Tasks</p>
                <p className="mt-0.5 text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
                  Tap a checked item to reopen it
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-amber-300/12 bg-amber-400/[0.08] px-2.5 py-1 text-[12px] font-semibold text-amber-200 tabular-nums">
                {completedTasks.length}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  completedExpanded && "rotate-180",
                )}
                style={{ color: "var(--text-faint)" }}
              />
            </div>
          </button>
          <AnimatePresence>
            {completedExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-2 p-3" style={{ borderTop: "1px solid var(--divider)" }}>
                  {completedTasks.length > 0 ? completedTasks.map((task) => {
                    const isSaving = Boolean(
                      getTodayTaskKey && pendingTodayTaskKeys.has(getTodayTaskKey(task)),
                    );

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleToggleToday(task, false)}
                        disabled={isSaving}
                        className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors disabled:cursor-wait disabled:opacity-55"
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--completed-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-300/18 bg-amber-400/[0.12] text-amber-200">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium line-through" style={{ color: "var(--text-secondary)" }}>
                            {task.title}
                          </p>
                          <p className="truncate text-[11px]" style={{ color: "var(--text-faint)" }}>
                            {task.goalTitle || task.category || "Completed"}
                          </p>
                        </div>
                        <span className="min-w-[58px] shrink-0 rounded-full px-2.5 py-1 text-center text-[11px] font-semibold" style={{ border: "1px solid var(--completed-reopen-border)", background: "var(--completed-reopen-bg)", color: "var(--completed-reopen-text)" }}>
                          {isSaving ? "Saving" : "Reopen"}
                        </span>
                      </button>
                    );
                  }) : (
                    <p className="px-2 py-3 text-[13px] font-medium" style={{ color: "var(--text-faint)" }}>
                      Nothing completed yet.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>{/* end left column */}

        {/* RIGHT COLUMN — desktop only */}
        <div className="hidden md:flex flex-col gap-4 sticky top-5">
          <div className="overflow-hidden rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "var(--surface-shadow)" }}>
            <div className="flex min-h-[52px] items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-amber-300/16 bg-amber-400/[0.08] text-amber-300"><Trophy className="h-4 w-4" /></div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Completed Today</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Tap to reopen</p>
                </div>
              </div>
              <span className="rounded-full border border-amber-300/12 bg-amber-400/[0.08] px-2.5 py-1 text-[12px] font-semibold text-amber-200 tabular-nums">{completedTasks.length}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {completedTasks.length > 0 ? (
                <div className="space-y-1 p-3">
                  {completedTasks.map((task) => {
                    const s = Boolean(getTodayTaskKey && pendingTodayTaskKeys.has(getTodayTaskKey(task)));
                    return (
                      <button key={task.id} type="button" onClick={() => handleToggleToday(task, false)} disabled={s}
                        className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors disabled:opacity-55"
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--completed-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-amber-300/18 bg-amber-400/[0.12] text-amber-200"><CheckCircle2 className="h-3.5 w-3.5" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium line-through" style={{ color: "var(--text-secondary)" }}>{task.title}</p>
                          <p className="truncate text-[11px]" style={{ color: "var(--text-faint)" }}>{task.goalTitle || task.category || "Completed"}</p>
                        </div>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ border: "1px solid var(--completed-reopen-border)", background: "var(--completed-reopen-bg)", color: "var(--completed-reopen-text)" }}>{s ? "Saving" : "Reopen"}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <CheckCircle2 className="h-8 w-8" style={{ color: "var(--text-faint)" }} />
                  <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Nothing completed yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "var(--surface-shadow)" }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Today at a Glance</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[10px] p-3" style={{ background: "var(--stat-cell-bg)", border: "1px solid var(--stat-cell-border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-faint)" }}>Done</p>
                <p className="mt-1 text-[22px] font-black tracking-tight tabular-nums" style={{ color: "var(--text-primary)" }}>{todayCompletedCount}<span className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>/{todayTotalCount}</span></p>
              </div>
              <div className="rounded-[10px] p-3" style={{ background: "var(--stat-cell-bg)", border: "1px solid var(--stat-cell-border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-faint)" }}>Progress</p>
                <p className="mt-1 text-[22px] font-black tracking-tight text-emerald-300 tabular-nums">{Math.round(todayProgress)}%</p>
              </div>
            </div>
          </div>

          <motion.button type="button" whileTap={{ scale: 0.985 }} onClick={() => setView("planner")}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-colors"
            style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "var(--surface-shadow)", color: "var(--text-muted)" }}>
            <span>Open Planner</span><ChevronRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showBreather && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-4 right-4 top-20 z-[200] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_20px_60px_-38px_rgba(0,0,0,0.3)] backdrop-blur-xl md:left-auto md:right-8 md:top-auto md:bottom-8 md:max-w-sm"
            style={{ background: "var(--toast-bg)", border: "1px solid var(--toast-border)" }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/[0.09] text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{breatherMessage}</p>
              <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{lastCompleted}</p>
            </div>
            <button
              onClick={() => {
                if (breatherTimeout) {
                  clearTimeout(breatherTimeout);
                  setBreatherTimeout(null);
                }
                setShowBreather(false);
              }}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{ background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <TaskPreviewCard
        open={Boolean(previewTask)}
        onClose={() => setPreviewTask(null)}
        title={previewTask?.title || ""}
        subtitle={previewTask?.isHabit ? "Habit" : "Task"}
        accentColor={previewTask?.categoryColor || (previewTask?.isHabit ? ACCENT : "#2dd4bf")}
        metadata={[
          {
            label: previewTask?.isHabit ? "Streak" : "Goal",
            value: previewTask?.isHabit
              ? `${previewTask?.streak || 0} days`
              : previewTask?.goalTitle || "General Tasks",
            icon: previewTask?.isHabit ? "status" : "tag",
          },
          {
            label: "Category",
            value: previewTask?.category,
            icon: "tag",
          },
        ]}
      />
    </motion.div>
  );
}
