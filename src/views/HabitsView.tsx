import React, { useState, useMemo } from "react";
import { 
  subDays, 
  eachDayOfInterval, 
  format, 
  startOfMonth, 
  endOfMonth,
} from "date-fns";
import { 
  Plus, 
  Activity, 
  Flame, 
  Check, 
  Settings, 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { isDueOnDate, type Category, type Habit } from "../storage";
import { cn } from "../lib/utils";
import { CircularProgress } from "../components/ui/CircularProgress";

const HABIT_SURFACE = "rounded-xl overflow-hidden oryn-surface";
const HABIT_SURFACE_UNCLIPPED = "rounded-xl oryn-surface";
const HABIT_SUMMARY_ACCENT = "#87c4ff";

type RgbColor = { r: number; g: number; b: number };
type HabitFilter = "all" | "today" | "completed";

type HabitsViewProps = {
  isCompletedOnDate: (habit: Habit, date: Date) => boolean;
  setIsAddingHabit: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingHabit: React.Dispatch<React.SetStateAction<Habit | null>>;
  setNewHabit: React.Dispatch<React.SetStateAction<Partial<Habit>>>;
  setHabitCompletedOptimistic: (
    id: string,
    date?: string,
    done?: boolean,
  ) => void | Promise<void>;
  habits?: Habit[];
  categories?: Category[];
};

const HABIT_FILTERS: { label: string; value: HabitFilter }[] = [
  { label: "All", value: "all" },
  { label: "Due today", value: "today" },
  { label: "Completed", value: "completed" },
];

function parseHexColor(color: string): RgbColor {
  const fallback = { r: 16, g: 185, b: 129 };
  if (!color || !color.startsWith("#")) return fallback;

  const raw = color.slice(1);
  const hex = raw.length === 3
    ? raw.split("").map((char) => `${char}${char}`).join("")
    : raw;

  if (hex.length !== 6) return fallback;

  const value = Number.parseInt(hex, 16);
  if (Number.isNaN(value)) return fallback;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixColors(base: RgbColor, target: RgbColor, amount: number): RgbColor {
  return {
    r: Math.round(base.r + (target.r - base.r) * amount),
    g: Math.round(base.g + (target.g - base.g) * amount),
    b: Math.round(base.b + (target.b - base.b) * amount),
  };
}

function rgbToString(color: RgbColor, alpha = 1) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function createHabitPalette(color: string) {
  const base = parseHexColor(color);
  const soft = mixColors(base, { r: 255, g: 255, b: 255 }, 0.1);
  const bright = mixColors(base, { r: 255, g: 255, b: 255 }, 0.24);
  const glow = mixColors(base, { r: 255, g: 255, b: 255 }, 0.36);
  const inactive = mixColors(base, { r: 35, g: 39, b: 44 }, 0.9);

  return {
    accent: rgbToString(soft),
    badgeFill: rgbToString(base, 0.13),
    badgeBorder: rgbToString(base, 0.42),
    pillFill: rgbToString(base, 0.15),
    pillBorder: rgbToString(base, 0.42),
    buttonFill: rgbToString(base, 0.14),
    buttonBorder: rgbToString(base, 0.42),
    inactiveDot: rgbToString(inactive, 0.95),
    completeDots: [
      rgbToString(base, 0.78),
      rgbToString(soft, 0.92),
      rgbToString(bright, 1),
      rgbToString(glow, 1),
    ],
  };
}

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isHabitDueToday(habit: Habit, today: Date) {
  return isDueOnDate(
    {
      created_at: habit.created_at,
      repeat: habit.repeat,
      due_date: habit.due_date,
    },
    today,
  );
}

// --- Sub-components ---

type HabitCardProps = {
  habit: Habit;
  categories: Category[];
  isCompletedOnDate: (habit: Habit, date: Date) => boolean;
  setHabitCompletedOptimistic: (
    id: string,
    date?: string,
    done?: boolean,
  ) => void | Promise<void>;
  setEditingHabit: React.Dispatch<React.SetStateAction<Habit | null>>;
  setNewHabit: React.Dispatch<React.SetStateAction<Partial<Habit>>>;
  setIsAddingHabit: React.Dispatch<React.SetStateAction<boolean>>;
  motion: typeof motion;
  cn: typeof cn;
};

const HabitCard = ({ 
  habit, 
  categories, 
  isCompletedOnDate, 
  setHabitCompletedOptimistic,
  setEditingHabit, 
  setNewHabit, 
  setIsAddingHabit,
  motion,
  cn 
}: HabitCardProps) => {
  const cat = categories.find((c: Category) => c.name === habit.category) || { color: "#64748b", icon: "✨" };
  // Per-habit color takes priority, falls back to category color
  const accentColor = habit.color || cat.color;
  const palette = useMemo(() => createHabitPalette(accentColor), [accentColor]);
  const isDoneToday = isCompletedOnDate(habit, new Date());
  const openEditHabit = () => {
    setEditingHabit(habit);
    setNewHabit(habit);
    setIsAddingHabit(true);
  };

  // Calculate roughly 60-day heatmap (4 rows x ~15 columns)
  const heatmapDays = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 59);
    return eachDayOfInterval({ start, end }).map(date => ({
      date,
      isCompleted: isCompletedOnDate(habit, date)
    }));
  }, [habit, isCompletedOnDate]);

  // Calculate monthly percentage
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const daysInterval = eachDayOfInterval({ start, end });
    const completedInMonth = daysInterval.filter(d => isCompletedOnDate(habit, d));
    return Math.round((completedInMonth.length / daysInterval.length) * 100);
  }, [habit, isCompletedOnDate]);

  // Subtitle: use description if available, otherwise fallback to category + repeat
  const subtitle = habit.description || `${habit.category} · ${habit.repeat}`;

  return (
    <div
      onClick={() => {
        if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
          openEditHabit();
        }
      }}
      className={`${HABIT_SURFACE} p-4 md:p-5 flex flex-col gap-3 md:gap-4 transition-all duration-300 group max-w-full cursor-pointer md:cursor-default`}
    >
      {/* Header Row */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Circular icon badge */}
          <div
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-lg md:text-xl shrink-0 border"
            style={{
              backgroundColor: palette.badgeFill,
              borderColor: palette.badgeBorder,
              color: palette.accent
            }}
          >
            {cat.icon || "✨"}
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="text-[16px] md:text-[17px] font-semibold tracking-tight leading-tight truncate" style={{ color: "var(--text-primary)" }}>
              {habit.title}
            </h4>
            <p className="text-[12px] md:text-[13px] font-medium mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Settings — hover reveal */}
          <button
            onClick={(event) => {
              event.stopPropagation();
              openEditHabit();
            }}
            className="p-2 border border-transparent rounded-lg text-transparent transition-all duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--surface-border-strong)";
              e.currentTarget.style.background = "var(--hover-overlay)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = "";
              e.currentTarget.style.color = "";
            }}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Streak pill — gradient presentation */}
          <div
            className="px-2.5 py-1 rounded-lg flex items-center gap-1 text-[12px] font-bold border"
            style={{
              backgroundColor: palette.pillFill,
              borderColor: palette.pillBorder,
              color: palette.accent
            }}
          >
            <Flame className="w-3.5 h-3.5 opacity-90" />
            <span className="opacity-80 pb-[1px] ml-[1px]">↑</span> {habit.streak || 0}
          </div>
        </div>
      </div>

      {/* Heatmap Area - 4-row grid */}
      <div className="w-full">
        <div className="grid grid-rows-4 grid-flow-col gap-[3px] overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {heatmapDays.map((day, i) => {
            const tone = palette.completeDots[(day.date.getDate() + i) % palette.completeDots.length];
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  opacity: day.isCompleted ? 1 : 0.72,
                }}
                style={day.isCompleted ? { backgroundColor: tone } : undefined}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "w-[8px] h-[8px] md:w-[10px] md:h-[10px] rounded-[3px] shrink-0",
                  day.isCompleted ? "" : "oryn-heatmap-empty",
                )}
                title={format(day.date, 'MMM d')}
              />
            );
          })}
        </div>
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between pt-1">
        {/* Monthly stat */}
        <span className="text-[13px]">
          <span className="font-semibold" style={{ color: palette.accent }}>{monthlyStats}%</span>
          <span className="font-medium ml-1.5" style={{ color: "var(--text-muted)" }}>this month</span>
        </span>

        {/* Action button */}
        <motion.button
          onClick={(event) => {
            event.stopPropagation();
            setHabitCompletedOptimistic(
              habit.id,
              getToday().toISOString(),
              !isDoneToday,
            );
          }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "px-3.5 md:px-4 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-all duration-300 border",
            isDoneToday
              ? ""
              : "border-transparent" // overriden by style
          )}
          style={{
            backgroundColor: isDoneToday ? undefined : palette.buttonFill,
            borderColor: isDoneToday ? undefined : palette.buttonBorder,
            color: isDoneToday ? "var(--text-muted)" : palette.accent,
            ...(isDoneToday
              ? { borderColor: "var(--surface-border)", backgroundColor: "var(--hover-overlay)" }
              : {}),
          }}
        >
          {isDoneToday ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Completed <span className="text-[9px] ml-1 opacity-50">&gt;</span>
            </>
          ) : (
            <>
              Mark complete <span className="text-[10px] ml-1.5 opacity-80" style={{color: palette.accent}}>&gt;</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export function HabitsView(props: HabitsViewProps) {
  const {
    isCompletedOnDate,
    setIsAddingHabit,
    setEditingHabit,
    setNewHabit,
    setHabitCompletedOptimistic,
    habits = [],
    categories = [],
  } = props;

  const [filter, setFilter] = useState<HabitFilter>('all');

  // --- Calculations ---
  const stats = useMemo(() => {
    const today = getToday();
    const dueToday = habits.filter((h) => isHabitDueToday(h, today));
    const completedToday = dueToday.filter((h) => isCompletedOnDate(h, today));
    return {
      total: dueToday.length,
      completed: completedToday.length,
      percent: dueToday.length > 0 ? Math.round((completedToday.length / dueToday.length) * 100) : 0
    };
  }, [habits, isCompletedOnDate]);

  // Real monthly consistency across all habits
  const monthlyConsistency = useMemo(() => {
    if (habits.length === 0) return 0;
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start, end });

    let totalPoints = 0;
    let possiblePoints = 0;

    habits.forEach((h) => {
      daysInMonth.forEach(day => {
        if (day <= now && isDueOnDate(h, day)) {
          possiblePoints++;
          if (isCompletedOnDate(h, day)) totalPoints++;
        }
      });
    });

    return possiblePoints > 0 ? Math.round((totalPoints / possiblePoints) * 100) : 0;
  }, [habits, isCompletedOnDate]);

  const filteredHabits = useMemo(() => {
    const today = getToday();
    switch (filter) {
      case 'today':
        return habits.filter(
          (h) => isHabitDueToday(h, today) && !isCompletedOnDate(h, today),
        );
      case 'completed':
        return habits.filter((h) => isCompletedOnDate(h, today));
      default:
        return habits;
    }
  }, [habits, filter, isCompletedOnDate]);

  return (
      <motion.div
      key="habits-premium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto w-full flex flex-col gap-5 md:gap-10 pb-28 md:pb-32 min-h-screen pt-5 md:pt-16"
      style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}
    >

      {/* ───── 1. TOP SUMMARY CARD (Replica style) ───── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`${HABIT_SURFACE_UNCLIPPED} min-h-[132px] p-4 sm:min-h-[148px] sm:p-6 relative overflow-visible`}
      >
        <div className="grid grid-cols-[60px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-5">
          <div className="shrink-0 overflow-visible">
            <CircularProgress progress={stats.percent} size={60} strokeWidth={6} color={HABIT_SUMMARY_ACCENT} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>
              {stats.percent}%
              <span className="ml-2 text-[14px] sm:text-[16px] font-normal" style={{ color: "var(--text-secondary)" }}>complete</span>
            </h2>
            <p className="mt-2 text-[13px] sm:text-[14px] font-medium leading-snug" style={{ color: "var(--text-secondary)" }}>
              {stats.total - stats.completed === 0
                ? "All habits crushed today"
                : `${stats.total - stats.completed} habit${stats.total - stats.completed !== 1 ? 's' : ''} left to win today`}
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[12px] font-medium tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Today</span>
            <span className="text-[13px] font-bold text-[#87c4ff]">
              {monthlyConsistency}% <span className="font-medium ml-1" style={{ color: "var(--text-faint)" }}>Avg</span>
            </span>
          </div>
          <div className="h-[4px] w-full rounded-full overflow-hidden" style={{ background: "var(--progress-track-light)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.percent}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-[linear-gradient(90deg,#87c4ff,#64d6aa)]"
            />
          </div>
        </div>
      </motion.div>

      {/* ───── 2. FILTER ROW ───── */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {HABIT_FILTERS.map((item) => {
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
                className={cn(
                  "px-3 sm:px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 border tracking-wide whitespace-nowrap",
                )}
                style={
                  filter === item.value
                    ? { background: "var(--pill-active-bg)", border: "1px solid var(--pill-active-border)", color: "var(--pill-active-text)" }
                    : { background: "var(--pill-inactive-bg)", border: "1px solid var(--pill-inactive-border)", color: "var(--pill-inactive-text)" }
                }
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setIsAddingHabit(true)}
          className="ml-auto shrink-0 h-8 px-3 rounded-lg border border-[#87c4ff]/20 bg-[#87c4ff]/10 text-[#87c4ff] hover:bg-[#87c4ff]/14 transition-colors duration-200 flex items-center justify-center gap-1.5 text-[12px] font-semibold"
          aria-label="Add habit"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add habit</span>
        </button>
      </div>

      {/* ───── 3. HABIT CARDS ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredHabits.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 text-center flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-xl flex items-center justify-center oryn-surface" style={{ color: "var(--text-muted)" }}>
                <Activity className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  No habits here yet
                </h3>
                <p className="max-w-sm mx-auto text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Start tracking your daily progress to build long-lasting consistency.
                </p>
              </div>
            </motion.div>
          ) : (
            filteredHabits.map((habit) => (
              <motion.div
                layout
                key={habit.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <HabitCard 
                  habit={habit} 
                  categories={categories}
                  isCompletedOnDate={isCompletedOnDate}
                  setHabitCompletedOptimistic={setHabitCompletedOptimistic}
                  setEditingHabit={setEditingHabit}
                  setNewHabit={setNewHabit}
                  setIsAddingHabit={setIsAddingHabit}
                  motion={motion}
                  cn={cn}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ───── 4. BOTTOM NEW HABIT BUTTON ───── */}
      <div className="mt-8 mb-8">
        <button
          onClick={() => setIsAddingHabit(true)}
          className={`${HABIT_SURFACE} w-full py-4 font-medium text-[15px] flex items-center justify-center gap-2 transition-colors duration-200`}
          style={{ color: "var(--text-primary)" }}
        >
          <Plus className="w-5 h-5 text-[#87c4ff]" />
          New Habit
        </button>
      </div>
    </motion.div>
  );
}
