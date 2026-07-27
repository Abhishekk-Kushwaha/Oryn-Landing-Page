import React from "react";
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Flame,
  GripVertical,
  Lock,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { DraggableMilestone } from "../components/dnd/DraggableMilestone";
import { DroppableCalendarDay } from "../components/dnd/DroppableDay";
import { cn } from "../lib/utils";
import type { Milestone } from "../storage";
import type { ViewType } from "../hooks/useAppRouter";

type CalendarItem = {
  id: string;
  title: string;
  done?: boolean;
  goalTitle?: string;
  categoryColor?: string;
  isHabit?: boolean;
  isGoalAsMilestone?: boolean;
};

type UnassignedMilestone = Milestone & {
  goalTitle: string;
};

type CalendarViewProps = {
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  setIsAddingMilestone: React.Dispatch<React.SetStateAction<boolean>>;
  newMilestone: Partial<Milestone>;
  setNewMilestone: React.Dispatch<React.SetStateAction<Partial<Milestone>>>;
  toggleHabitOptimistic: (id: string, date?: string, done?: boolean) => void | Promise<void>;
  toggleGoalCompletionOptimistic: (id: string, date?: string, done?: boolean) => void | Promise<void>;
  toggleMilestone: (id: string, date?: string) => void | Promise<void>;
  handleMarkAllDone: (ids: string[]) => void | Promise<void>;
  handleCalendarDragStart: (event: DragStartEvent) => void;
  handleCalendarDragEnd: (event: DragEndEvent) => void | Promise<void>;
  getItemsForDate: (date: Date) => CalendarItem[];
  currentMonth: Date;
  selectedDate: Date;
  milestonesForSelectedDate: CalendarItem[];
  todayMilestones: CalendarItem[];
  unassignedMilestones: UnassignedMilestone[];
  sensors: React.ComponentProps<typeof DndContext>["sensors"];
  activeCalendarDragId: string | null;
  activeCalendarMilestone: UnassignedMilestone | null;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Shared surface component ── */
function Surface({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl oryn-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CalendarView(props: CalendarViewProps) {
  const {
    setView,
    setSelectedDate,
    setCurrentMonth,
    setIsAddingMilestone,
    newMilestone,
    setNewMilestone,
    toggleHabitOptimistic,
    toggleGoalCompletionOptimistic,
    toggleMilestone,
    handleMarkAllDone,
    handleCalendarDragStart,
    handleCalendarDragEnd,
    getItemsForDate,
    currentMonth,
    selectedDate,
    milestonesForSelectedDate,
    todayMilestones,
    unassignedMilestones,
    sensors,
    activeCalendarDragId,
    activeCalendarMilestone,
  } = props;

  const [hasClickedAssign, setHasClickedAssign] = React.useState(() => {
    try {
      return localStorage.getItem("oryn_assign_tasks_clicked") === "true";
    } catch {
      return false;
    }
  });

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(endOfMonth(monthStart)),
    });
  }, [currentMonth]);

  const doneTodayCount = milestonesForSelectedDate.filter((m) => m.done).length;
  const totalTodayCount = milestonesForSelectedDate.length;
  const progressPct = totalTodayCount === 0 ? 0 : Math.round((doneTodayCount / totalTodayCount) * 100);

  // Only allow toggling tasks on today
  const isSelectedToday = isToday(selectedDate);
  const isPastDay = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
  const isFutureDay = !isSelectedToday && !isPastDay;

  // 30-day heatmap data
  const heatmapDays = React.useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (34 - i));
      const items = getItemsForDate(d);
      const total = items.length;
      const done = items.filter((m) => m.done).length;
      return { date: d, total, done, pct: total === 0 ? 0 : done / total };
    });
  }, [getItemsForDate]);

  // Monthly stats
  const monthlyStats = React.useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: today });
    let totalDone = 0;
    let bestDayCount = 0;
    let currentStreak = 0;
    let streakActive = true;
    // streak: count consecutive days from today backwards with at least 1 done
    const allDaysRev = [...days].reverse();
    for (const d of allDaysRev) {
      const items = getItemsForDate(d);
      const done = items.filter((m) => m.done).length;
      totalDone += done;
      if (done > bestDayCount) bestDayCount = done;
      if (streakActive) {
        if (done > 0) currentStreak++;
        else if (!isToday(d)) streakActive = false;
      }
    }
    return { totalDone, bestDayCount, currentStreak };
  }, [getItemsForDate]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleCalendarDragStart}
      onDragEnd={handleCalendarDragEnd}
    >
      <motion.div
        key="calendar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative min-h-screen w-full px-4 pb-28 pt-6 md:px-10 md:pb-10 md:pt-8"
        style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}
      >
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-[radial-gradient(ellipse_at_60%_0%,rgba(249,115,22,0.05),transparent_65%)]" />

        {/* ── Header ── */}
        <header className="relative mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--text-faint)" }}>
              Schedule
            </p>
            <h1 className="text-[28px] font-black tracking-[-0.035em] md:text-[32px]" style={{ color: "var(--text-primary)" }}>
              Calendar
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Assign tasks button */}
            <button
              onClick={() => {
                try {
                  localStorage.setItem("oryn_assign_tasks_clicked", "true");
                } catch (e) {
                  console.warn(e);
                }
                setHasClickedAssign(true);
                setView("assign-tasks");
              }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-orange-500/30 bg-orange-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all hover:bg-orange-500/30 hover:border-orange-500/40",
                !hasClickedAssign && "animate-assign-tasks-pulse"
              )}
            >
              <Plus className="h-3 w-3" />
              Assign Tasks
            </button>

            {/* Month navigator */}
            <div className="flex items-center gap-1 rounded-[11px] p-1" style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)" }}>
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Previous month"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[130px] text-center text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-primary)" }}>
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Main Grid ── */}
        <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

          {/* ═══ LEFT: Calendar Grid ═══ */}
          <div className="flex flex-col gap-5">
            <Surface className="p-5 md:p-6">
              {/* Day-of-week labels */}
            <div className="mb-3 grid grid-cols-7">
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: "var(--text-faint)" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day) => (
                <DroppableCalendarDay
                  key={day.toString()}
                  day={day}
                  isCurrentMonth={isSameMonth(day, currentMonth)}
                  isSelected={isSameDay(day, selectedDate)}
                  isTodayDay={isToday(day)}
                  dayMilestones={getItemsForDate(day)}
                  onClick={() => setSelectedDate(day)}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-5 flex items-center gap-5 pt-4" style={{ borderTop: "1px solid var(--divider)" }}>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-orange-400/80" />
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: "var(--text-faint)" }} />
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Has tasks</span>
              </div>
            </div>
          </Surface>

          {/* ── 30-Day Heatmap & Stats Card ── */}
          <Surface className="p-5 md:p-6">
            <div className="">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-3.5 w-3.5 text-orange-400/70" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-faint)" }}>35-Day Activity</span>
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>today →</span>
              </div>
              <div className="grid grid-cols-[repeat(35,1fr)] gap-0.5">
                {heatmapDays.map((d, i) => {
                  const intensity = d.total === 0 ? 0 : d.pct;
                  const isT = isToday(d.date);
                  return (
                    <div
                      key={i}
                      title={`${format(d.date, "MMM d")}: ${d.done}/${d.total} done`}
                      className={cn(
                        "h-4 rounded-[3px] cursor-default transition-all",
                        isT && "ring-1 ring-orange-400/60 ring-offset-1 ring-offset-[#090b0f]",
                      )}
                      style={{
                        backgroundColor:
                          d.total === 0
                            ? "rgba(255,255,255,0.04)"
                            : intensity >= 1
                            ? "rgba(249,115,22,0.85)"
                            : intensity >= 0.66
                            ? "rgba(249,115,22,0.55)"
                            : intensity >= 0.33
                            ? "rgba(249,115,22,0.28)"
                            : "rgba(249,115,22,0.12)",
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>Less</span>
                {[0.04, 0.12, 0.28, 0.55, 0.85].map((o, i) => (
                  <div key={i} className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: `rgba(249,115,22,${o})` }} />
                ))}
                <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>More</span>
              </div>
            </div>

            {/* ── Monthly Stats Row ── */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center rounded-[13px] py-3 px-2" style={{ border: "1px solid var(--stat-cell-border)", background: "var(--stat-cell-bg)" }}>
                <Flame className="mb-1 h-4 w-4 text-orange-400" />
                <span className="text-[18px] font-black tracking-tight text-orange-300 tabular-nums">{monthlyStats.currentStreak}</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>Day Streak</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-[13px] py-3 px-2" style={{ border: "1px solid var(--stat-cell-border)", background: "var(--stat-cell-bg)" }}>
                <CheckCircle2 className="mb-1 h-4 w-4 text-emerald-400" />
                <span className="text-[18px] font-black tracking-tight text-emerald-300 tabular-nums">{monthlyStats.totalDone}</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>Done This Month</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-[13px] py-3 px-2" style={{ border: "1px solid var(--stat-cell-border)", background: "var(--stat-cell-bg)" }}>
                <TrendingUp className="mb-1 h-4 w-4 text-blue-400" />
                <span className="text-[18px] font-black tracking-tight text-blue-300 tabular-nums">{monthlyStats.bestDayCount}</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>Best Day</span>
              </div>
            </div>
          </Surface>
        </div>

          {/* ═══ RIGHT: Sidebar panels ═══ */}
          <div className="flex flex-col gap-4">

            {/* ── Selected Day Details ── */}
            <Surface className="overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-faint)" }}>
                    {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE")}
                  </p>
                  <h2 className="mt-0.5 text-[17px] font-black tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>
                    {isToday(selectedDate)
                      ? "Today's Schedule"
                      : format(selectedDate, "MMMM d, yyyy")}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {/* Lock badge for non-today days */}
                  {!isSelectedToday && (
                    <div className={cn(
                      "flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                      isPastDay
                        ? ""
                        : "border-blue-400/18 bg-blue-500/[0.07] text-blue-300/70",
                    )} style={isPastDay ? { borderColor: "var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-faint)" } : undefined}>
                      <Lock className="h-3 w-3" />
                      {isPastDay ? "Past" : "Future"}
                    </div>
                  )}
                  {isSelectedToday && milestonesForSelectedDate.some((m) => !m.done) && (
                    <button
                      onClick={() =>
                        handleMarkAllDone(
                          milestonesForSelectedDate.filter((m) => !m.done).map((m) => m.id),
                        )
                      }
                      className="rounded-[8px] border border-orange-400/18 bg-orange-500/[0.07] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300 transition-colors hover:bg-orange-500/[0.12]"
                    >
                      Mark All
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      setNewMilestone({
                        ...newMilestone,
                        due_date: format(selectedDate, "yyyy-MM-dd"),
                      });
                      setIsAddingMilestone(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors"
                    style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
                    title="Add milestone to this day"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {totalTodayCount > 0 && (
                <div className="px-5 pt-3 pb-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>
                      {doneTodayCount}/{totalTodayCount} complete
                    </span>
                    <span className="text-[10px] font-bold text-orange-300">{progressPct}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full" style={{ background: "var(--progress-track-light)" }}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Milestone list */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDate.toString()}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="max-h-[340px] overflow-y-auto custom-scrollbar p-4 space-y-2"
                >
                  {milestonesForSelectedDate.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed py-12 text-center" style={{ borderColor: "var(--surface-border)" }}>
                      <Sparkles className="h-6 w-6" style={{ color: "var(--text-faint)" }} />
                      <p className="text-[12px] font-medium" style={{ color: "var(--text-faint)" }}>
                        No milestones for this day
                      </p>
                      <button
                        onClick={async () => {
                          setNewMilestone({
                            ...newMilestone,
                            due_date: format(selectedDate, "yyyy-MM-dd"),
                          });
                          setIsAddingMilestone(true);
                        }}
                        className="mt-1 rounded-[8px] border border-orange-400/18 bg-orange-500/[0.07] px-3 py-1.5 text-[11px] font-semibold text-orange-300 transition-colors hover:bg-orange-500/[0.12]"
                      >
                        + Add one
                      </button>
                    </div>
                  ) : (
                    milestonesForSelectedDate.map((ms, index) => (
                      <motion.div
                        key={ms.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={cn(
                          "group flex items-start gap-3 rounded-[13px] border p-3.5 transition-all duration-150",
                          ms.done
                            ? "border-orange-400/10 bg-orange-500/[0.04] opacity-60"
                            : "",
                          !isSelectedToday && "cursor-default",
                        )}
                        style={
                          ms.done
                            ? undefined
                            : { borderColor: "var(--surface-border)", background: "var(--hover-overlay)" }
                        }
                      >
                        {/* Toggle button — only active on today */}
                        <button
                          disabled={!isSelectedToday}
                          onClick={async () => {
                            if (!isSelectedToday) return;
                            if (ms.isHabit) {
                              toggleHabitOptimistic(ms.id, selectedDate.toISOString());
                            } else if (ms.isGoalAsMilestone) {
                              toggleGoalCompletionOptimistic(ms.id, selectedDate.toISOString());
                            } else {
                              toggleMilestone(ms.id, selectedDate.toISOString());
                            }
                          }}
                          title={!isSelectedToday ? "Can only mark today's tasks" : undefined}
                          className={cn(
                            "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-all duration-150",
                            ms.done
                              ? "border-orange-400/60 bg-orange-500 text-[#3a1205]"
                              : isSelectedToday
                              ? "hover:border-orange-400/50 cursor-pointer"
                              : "cursor-not-allowed opacity-40",
                          )}
                          style={ms.done ? undefined : { borderColor: "var(--surface-border-strong)" }}
                        >
                          {ms.done && <CheckCircle2 className="h-3 w-3" />}
                          {!ms.done && !isSelectedToday && <Lock className="h-2.5 w-2.5" style={{ color: "var(--text-faint)" }} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4
                            className={cn(
                              "text-[13px] font-semibold leading-snug truncate",
                              ms.done && "line-through",
                            )}
                            style={{ color: ms.done ? "var(--text-secondary)" : "var(--text-primary)" }}
                          >
                            {ms.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-1.5">
                            {ms.categoryColor && (
                              <div
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: ms.categoryColor }}
                              />
                            )}
                            <span className="truncate text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>
                              {ms.goalTitle}
                            </span>
                            {ms.isGoalAsMilestone && (
                              <span className="shrink-0 rounded-[4px] bg-blue-400/[0.12] border border-blue-400/18 px-1 text-[9px] font-semibold text-blue-300">
                                Repeating
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </Surface>
          </div>
        </div>

        {/* ── Drag Overlay ── */}
        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: "0.4" } },
            }),
          }}
        >
          {activeCalendarDragId && activeCalendarMilestone ? (
            <div className="rounded-[13px] px-4 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] backdrop-blur-xl pointer-events-none" style={{ border: "1px solid var(--surface-border-strong)", background: "var(--surface-modal)" }}>
              <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {activeCalendarMilestone.title}
              </p>
              <p className="mt-0.5 text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                {activeCalendarMilestone.goalTitle}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </motion.div>
    </DndContext>
  );
}
