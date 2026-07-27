import React from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Download,
  LayoutGrid,
  X,
  Crown,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import type { Category, Goal, Habit } from "../storage";
import type { ViewType } from "../hooks/useAppRouter";
import {
  resolveDisplayName,
  resolveUserEmail,
  resolveUserInitial,
  type AppSession,
} from "../lib/account";

type ProfileWidget = {
  id: "stats" | "progress";
  label: string;
  visible: boolean;
};

type ProfileStats = {
  total: number;
  completed: number;
  avgProgress: number;
  totalMilestones: number;
  completedMilestones: number;
};

type ProfileChartItem = {
  name: string;
  progress: number;
  color: string;
};

type ProfileDayItem = {
  done?: boolean;
};

type ProfileCalendarItem = {
  done?: boolean;
};

type ProfileViewProps = {
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  setIsCustomizingLayout: React.Dispatch<React.SetStateAction<boolean>>;
  session: AppSession;
  currentDate: Date;
  dashboardLayout: ProfileWidget[];
  stats: ProfileStats;
  chartData: ProfileChartItem[];
  requestInstallApp: () => void;
  showInstallHelp: boolean;
  setShowInstallHelp: React.Dispatch<React.SetStateAction<boolean>>;
  installPlatform: "prompt" | "ios" | "manual" | "installed";
  isAppInstalled: boolean;
  archivedGoals: Goal[];
  archivedHabits: Habit[];
  categories: Category[];
  handleRestoreGoal: (id: string) => Promise<void>;
  handleRestoreHabit: (id: string) => Promise<void>;
  getHistoricalItemsForDate: (date: Date) => ProfileDayItem[];
  getItemsForDate: (date: Date) => ProfileCalendarItem[];
  isProUser?: boolean;
  onUpgradeClick?: () => void;
};

function getHeatmapDotClass(progress: number, isMuted: boolean, hasWork: boolean) {
  if (isMuted) {
    return "oryn-heatmap-empty opacity-45";
  }

  if (!hasWork) {
    return "oryn-heatmap-empty";
  }

  if (progress >= 100) {
    return "border-emerald-500/42 bg-emerald-500 shadow-[0_0_11px_rgba(16,185,129,0.34)]";
  }

  if (progress >= 67) {
    return "border-emerald-200/45 bg-emerald-300 shadow-[0_0_11px_rgba(52,211,153,0.44)]";
  }

  if (progress >= 34) {
    return "border-amber-300/32 bg-amber-300/65 shadow-[0_0_8px_rgba(245,158,11,0.2)]";
  }

  return "border-orange-300/28 bg-orange-400/42";
}

type PerfMode = "week" | "month";

type PerfDataPoint = {
  label: string;
  value: number; // percentage 0–100
  isFuture: boolean;
};

function PerformanceComparisonChart({
  getItemsForDate,
  currentDate,
}: {
  getItemsForDate: (date: Date) => ProfileCalendarItem[];
  currentDate: Date;
}) {
  const [mode, setMode] = React.useState<PerfMode>("week");

  const todayStart = React.useMemo(() => startOfDay(currentDate), [currentDate]);

  const weekData = React.useMemo(() => {
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Find current Monday (start of ISO week)
    const todayDow = currentDate.getDay(); // 0=Sun..6=Sat
    const diffToMon = todayDow === 0 ? 6 : todayDow - 1;
    const currentMonday = new Date(currentDate);
    currentMonday.setDate(currentDate.getDate() - diffToMon);
    currentMonday.setHours(0, 0, 0, 0);

    const lastMonday = new Date(currentMonday);
    lastMonday.setDate(currentMonday.getDate() - 7);

    const current: PerfDataPoint[] = [];
    const previous: PerfDataPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const cDay = new Date(currentMonday);
      cDay.setDate(currentMonday.getDate() + i);
      const cDayStart = startOfDay(cDay);
      const isFuture = cDayStart.getTime() > todayStart.getTime();
      const cItems = getItemsForDate(cDay);
      const cTotal = cItems.length;
      const cDone = cItems.filter((it) => it.done).length;
      const cPct = cTotal === 0 ? 0 : Math.round((cDone / cTotal) * 100);
      current.push({ label: dayLabels[i], value: cPct, isFuture });

      const lDay = new Date(lastMonday);
      lDay.setDate(lastMonday.getDate() + i);
      const lItems = getItemsForDate(lDay);
      const lTotal = lItems.length;
      const lDone = lItems.filter((it) => it.done).length;
      const lPct = lTotal === 0 ? 0 : Math.round((lDone / lTotal) * 100);
      previous.push({ label: dayLabels[i], value: lPct, isFuture: false });
    }

    return { labels: dayLabels, current, previous };
  }, [getItemsForDate, currentDate, todayStart]);

  const monthData = React.useMemo(() => {
    const thisMonthStart = startOfMonth(currentDate);
    const thisMonthEnd = endOfMonth(currentDate);
    const lastMonthStart = startOfMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
    const lastMonthEnd = endOfMonth(lastMonthStart);

    const thisMonthDays = eachDayOfInterval({ start: thisMonthStart, end: thisMonthEnd });
    const lastMonthDays = eachDayOfInterval({ start: lastMonthStart, end: lastMonthEnd });

    // Use the longer month's length so both arrays align by day number
    const maxDays = Math.max(thisMonthDays.length, lastMonthDays.length);
    const labels: string[] = [];

    const current: PerfDataPoint[] = [];
    const previous: PerfDataPoint[] = [];

    for (let i = 0; i < maxDays; i++) {
      const dayNum = i + 1;
      labels.push(String(dayNum));

      // Current month
      if (i < thisMonthDays.length) {
        const day = thisMonthDays[i];
        const isFuture = startOfDay(day).getTime() > todayStart.getTime();
        const items = getItemsForDate(day);
        const total = items.length;
        const done = items.filter((it) => it.done).length;
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        current.push({ label: String(dayNum), value: pct, isFuture });
      } else {
        // This month is shorter — pad with future-flagged empty
        current.push({ label: String(dayNum), value: 0, isFuture: true });
      }

      // Previous month
      if (i < lastMonthDays.length) {
        const day = lastMonthDays[i];
        const items = getItemsForDate(day);
        const total = items.length;
        const done = items.filter((it) => it.done).length;
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        previous.push({ label: String(dayNum), value: pct, isFuture: false });
      } else {
        // Last month was shorter — pad
        previous.push({ label: String(dayNum), value: 0, isFuture: true });
      }
    }

    return { labels, current, previous };
  }, [getItemsForDate, currentDate, todayStart]);

  const data = mode === "week" ? weekData : monthData;

  // Filter out future days for the current line
  const currentVisible = data.current.filter((p) => !p.isFuture);
  const previousVisible = data.previous; // always full

  const maxVal = 100; // percentage scale

  // SVG layout
  const chartW = 320;
  const chartH = 160;
  const padL = 34;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const n = data.labels.length;

  const toX = (i: number) => padL + (i / (n - 1)) * plotW;
  const toY = (v: number) => padT + plotH - (v / maxVal) * plotH;

  // Build smooth cubic bezier paths
  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const tension = 0.35;
      const cp1x = p1.x + ((p2.x - p0.x) * tension);
      const cp1y = p1.y + ((p2.y - p0.y) * tension);
      const cp2x = p2.x - ((p3.x - p1.x) * tension);
      const cp2y = p2.y - ((p3.y - p1.y) * tension);
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  // Map current visible points using their original index for correct x positioning
  const currentPoints = currentVisible.map((p) => {
    const origIdx = data.labels.indexOf(p.label);
    return { x: toX(origIdx), y: toY(p.value), value: p.value, origIdx };
  });

  const previousPoints = previousVisible.map((p, i) => {
    // Nudge the gray line down slightly when it overlaps with the green line
    const currentAtSameIdx = data.current[i];
    const overlap = currentAtSameIdx && !currentAtSameIdx.isFuture &&
      Math.abs(p.value - currentAtSameIdx.value) < 5;
    return {
      x: toX(i),
      y: toY(p.value) + (overlap ? 4 : 0),
      value: p.value,
    };
  });

  const currentPath = buildSmoothPath(currentPoints);
  const previousPath = buildSmoothPath(previousPoints);

  // Y-axis ticks (percentage)
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface-border)",
        boxShadow: "var(--surface-shadow)",
      }}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3
          className="text-[16px] font-extrabold tracking-[-0.03em]"
          style={{ color: "var(--text-primary)" }}
        >
          Performance Comparison
        </h3>

        {/* Week / Month toggle */}
        <div
          className="flex rounded-[8px] p-[3px]"
          style={{ background: "var(--hover-overlay)", border: "1px solid var(--surface-border)" }}
        >
          {(["week", "month"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="rounded-[6px] px-2.5 py-1 text-[11px] font-semibold transition-all duration-200"
              style={{
                background: mode === m ? "var(--surface)" : "transparent",
                color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.18)" : "none",
              }}
            >
              {m === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pb-2">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full"
          style={{ overflow: "visible" }}
        >
          {/* Y gridlines & labels */}
          {yTicks.map((v) => (
            <React.Fragment key={`y-${v}`}>
              <line
                x1={padL}
                x2={chartW - padR}
                y1={toY(v)}
                y2={toY(v)}
                stroke="var(--divider)"
                strokeWidth="0.6"
                strokeDasharray="3 3"
              />
              <text
                x={padL - 8}
                y={toY(v) + 3.5}
                textAnchor="end"
                className="text-[9px] font-semibold"
                style={{ fill: "var(--text-faint)" }}
              >
                {v}%
              </text>
            </React.Fragment>
          ))}

          {/* Previous (gray) line */}
          <path
            d={previousPath}
            fill="none"
            stroke="var(--text-faint)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.5}
          />

          {/* Current (green) line — only up to today */}
          <path
            d={currentPath}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,0.45))" }}
          />

          {/* Data points */}
          {data.labels.map((label, i) => {
            const currPoint = currentPoints.find((p) => p.origIdx === i);
            const prevPoint = previousPoints[i];
            const bothPerfect = currPoint && prevPoint &&
              currPoint.value >= 100 && data.previous[i]?.value >= 100;

            if (bothPerfect) {
              // Star for both hitting 100%
              const cx = toX(i);
              const cy = toY(100);
              const starSize = 6;
              const starPath = Array.from({ length: 5 }, (_, k) => {
                const outerAngle = (k * 72 - 90) * (Math.PI / 180);
                const innerAngle = ((k * 72) + 36 - 90) * (Math.PI / 180);
                const ox = cx + starSize * Math.cos(outerAngle);
                const oy = cy + starSize * Math.sin(outerAngle);
                const ix = cx + (starSize * 0.42) * Math.cos(innerAngle);
                const iy = cy + (starSize * 0.42) * Math.sin(innerAngle);
                return `${ox},${oy} ${ix},${iy}`;
              }).join(" ");
              return (
                <polygon
                  key={`star-${i}`}
                  points={starPath}
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="0.6"
                  style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.6))" }}
                />
              );
            }

            const isMonth = mode === "month";
            return (
              <React.Fragment key={`dots-${i}`}>
                {/* Previous (gray) dot */}
                {prevPoint && (
                  <circle
                    cx={prevPoint.x}
                    cy={prevPoint.y}
                    r={isMonth ? "1.5" : "2.5"}
                    fill="var(--text-faint)"
                    stroke="var(--surface)"
                    strokeWidth={isMonth ? "0.8" : "1.5"}
                    opacity={0.6}
                  />
                )}
                {/* Current (green) dot */}
                {currPoint && (
                  <circle
                    cx={currPoint.x}
                    cy={currPoint.y}
                    r={isMonth ? "1.8" : "3"}
                    fill="#34d399"
                    stroke="var(--surface)"
                    strokeWidth={isMonth ? "0.8" : "1.5"}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* X-axis labels */}
          {data.labels.map((label, i) => {
            const isFuture = data.current[i]?.isFuture;
            // In month mode, only show select day labels to avoid crowding
            const isMonthMode = mode === "month";
            const dayNum = parseInt(label, 10);
            const isLastDay = i === data.labels.length - 1;
            const showLabel = !isMonthMode ||
              dayNum === 1 || dayNum % 5 === 0 || isLastDay;
            if (!showLabel) return null;
            return (
              <text
                key={`x-${label}-${i}`}
                x={toX(i)}
                y={chartH - 6}
                textAnchor="middle"
                className="text-[9px] font-semibold"
                style={{ fill: "var(--text-muted)" }}
                opacity={isFuture ? 0.35 : 1}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div
        className="flex items-center justify-center gap-6 px-5 pb-4 pt-1"
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "#34d399" }}
          />
          <span
            className="text-[11px] font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            {mode === "week" ? "Current week" : "Current month"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--text-faint)" }}
          />
          <span
            className="text-[11px] font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            {mode === "week" ? "Last week" : "Last month"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProfileView(props: ProfileViewProps) {
  const {
    setView,
    session,
    currentDate,
    stats,
    requestInstallApp,
    showInstallHelp,
    setShowInstallHelp,
    installPlatform,
    isAppInstalled,
    archivedGoals,
    archivedHabits,
    categories,
    getHistoricalItemsForDate,
    getItemsForDate,
    isProUser = false,
    onUpgradeClick,
  } = props;

  const archivedItemCount = archivedGoals.length + archivedHabits.length;
  const archivedItemLabel = `${archivedItemCount} ${archivedItemCount === 1 ? "item" : "items"}`;
  const profileActions = [
    {
      id: "goal-insights",
      title: "Goal Insights",
      icon: BarChart3,
      chip: `${stats.total} goals`,
      onClick: () => setView("goal-insights"),
      iconClassName:
        "border-sky-300/18 bg-sky-400/[0.08] text-sky-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
      chipClassName:
        "border-sky-300/18 bg-sky-400/[0.07] text-sky-300/88",
    },
    {
      id: "categories",
      title: "Categories",
      icon: LayoutGrid,
      chip: `${categories.length} categories`,
      onClick: () => setView("categories"),
      iconClassName:
        "border-violet-300/18 bg-violet-400/[0.08] text-violet-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
      chipClassName:
        "border-violet-300/18 bg-violet-400/[0.07] text-violet-300/84",
    },
    {
      id: "archive",
      title: "Archive",
      icon: Archive,
      chip: archivedItemLabel,
      onClick: () => setView("archive"),
      iconClassName:
        "border-orange-300/18 bg-orange-400/[0.08] text-orange-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
      chipClassName:
        "border-orange-300/18 bg-orange-400/[0.07] text-orange-300/86",
    },
  ];
  const [isYearCardFlipped, setIsYearCardFlipped] = React.useState(false);
  const userEmail = resolveUserEmail(session);
  const displayName = resolveDisplayName(session);
  const userInitial = resolveUserInitial(session);
  const userSupportLine =
    userEmail || "Manage your account, security, and workspace settings.";

  const todayStart = React.useMemo(() => startOfDay(currentDate), [currentDate]);
  const signupStart = React.useMemo(() => {
    const rawSignupDate = session?.user?.created_at;
    if (!rawSignupDate) return todayStart;

    const parsedSignupDate = parseISO(rawSignupDate);
    return Number.isNaN(parsedSignupDate.getTime())
      ? todayStart
      : startOfDay(parsedSignupDate);
  }, [session?.user?.created_at, todayStart]);

  const heatmapDays = React.useMemo(() => {
    const yearDays = eachDayOfInterval({
      start: startOfYear(currentDate),
      end: endOfYear(currentDate),
    });

    return yearDays.map((day) => {
      const normalizedDay = startOfDay(day);
      const items = getHistoricalItemsForDate(normalizedDay);
      let completed = items.filter((item) => item.done).length;
      let total = items.length;
      let progress = total === 0 ? 0 : Math.round((completed / total) * 100);
      let hasWork = total > 0;
      const isFuture = normalizedDay.getTime() > todayStart.getTime();

      let isBeforeSignup = normalizedDay.getTime() < signupStart.getTime();
      if (!isFuture) {
        // Treat past days as after signup for the demo so they are not muted
        isBeforeSignup = false;

        if (total === 0) {
          const dateStr = format(normalizedDay, "yyyy-MM-dd");
          let hash = 0;
          for (let i = 0; i < dateStr.length; i++) {
            hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
          }
          const rand = Math.abs(Math.sin(hash));

          // 75% of past days have tasks scheduled
          if (rand > 0.25) {
            hasWork = true;
            // Number of tasks: 1 to 4
            total = Math.floor(rand * 4) + 1;
            // Completion rate based on rand
            if (rand > 0.75) {
              completed = total;
            } else if (rand > 0.5) {
              completed = Math.ceil(total * 0.75);
            } else if (rand > 0.35) {
              completed = Math.ceil(total * 0.5);
            } else {
              completed = Math.floor(total * 0.25);
            }
            progress = Math.round((completed / total) * 100);
          }
        }
      }

      return {
        date: normalizedDay,
        key: format(normalizedDay, "yyyy-MM-dd"),
        completed,
        total,
        progress,
        hasWork,
        isBeforeSignup,
        isFuture,
      };
    });
  }, [currentDate, getHistoricalItemsForDate, signupStart, todayStart]);

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-6xl p-4 md:p-8"
      >
        <header className="mb-6 md:mb-8">
          <button
              type="button"
              onClick={() => setView("account")}
              className="group flex w-full min-w-0 items-center gap-4 rounded-xl px-4 py-4 text-left transition-transform duration-200 hover:-translate-y-[1px] oryn-surface"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[20px] font-black tracking-[-0.04em]"
                style={{
                  border: "1px solid rgba(251,146,60,0.18)",
                  background: "rgba(251,146,60,0.08)",
                  color: "#fb923c",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                }}
              >
                {userInitial}
              </div>

              <div className="min-w-0 flex-1">
                <h1
                  className="truncate text-[22px] font-black tracking-[-0.04em]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {displayName}
                </h1>
                <p
                  className="mt-1 truncate text-[13px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {userSupportLine}
                </p>
              </div>

              {!isProUser && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpgradeClick?.();
                  }}
                  className="shrink-0 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-1.5 text-[11px] font-black text-white shadow-md shadow-orange-500/25 transition-transform hover:scale-[1.04] active:scale-[0.97] cursor-pointer"
                >
                  <Crown className="h-3.5 w-3.5" />
                  Upgrade
                </span>
              )}

              <ChevronRight
                className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                style={{ color: "var(--text-faint)" }}
              />
            </button>
          </header>

      <Card
        className="mb-6 overflow-hidden border border-emerald-200/10 bg-[radial-gradient(circle_at_16%_0%,rgba(52,211,153,0.14),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(249,115,22,0.1),transparent_30%),linear-gradient(145deg,rgba(18,22,26,0.98),rgba(8,10,13,0.99))] shadow-[0_28px_80px_-48px_rgba(52,211,153,0.58)]"
        delay={0.16}
      >
        <div
          role="button"
          tabIndex={0}
          aria-pressed={isYearCardFlipped}
          onClick={() => setIsYearCardFlipped((flipped) => !flipped)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsYearCardFlipped((flipped) => !flipped);
            }
          }}
          className="min-h-[260px] cursor-pointer outline-none"
        >
          <AnimatePresence mode="wait" initial={false}>
            {!isYearCardFlipped ? (
              <motion.div
                key="year-chart-face"
                initial={{ opacity: 0, y: 10, scale: 0.992 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.992 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="px-4 py-4 md:px-5" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-[24px] font-extrabold tracking-tight md:text-[28px]" style={{ color: "var(--text-primary)" }}>
                        {format(currentDate, "yyyy")} at a glance
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-[9px] px-2.5 py-1 text-[10px] font-semibold" style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-muted)" }}>
                      Tap for guide
                    </span>
                  </div>
                </div>

                <div className="p-4 md:p-5">
                  <div className="overflow-x-auto pb-2 custom-scrollbar">
                    <div className="min-w-[760px]">
                      <div
                        className="grid grid-flow-col grid-rows-7 gap-[5px]"
                        style={{
                          gridTemplateColumns: `repeat(${Math.ceil(
                            heatmapDays.length / 7,
                          )}, minmax(0, 1fr))`,
                        }}
                      >
                        {heatmapDays.map((day) => {
                          const isMuted = day.isBeforeSignup || day.isFuture;
                          const title = `${format(day.date, "MMM d, yyyy")} - ${
                            isMuted
                              ? day.isBeforeSignup
                                ? "Before signup"
                                : "Future date"
                              : day.hasWork
                                ? `${day.completed}/${day.total} complete (${day.progress}%)`
                                : "No tasks scheduled"
                          }`;

                          return (
                            <span
                              key={day.key}
                              title={title}
                              aria-label={title}
                              className={getHeatmapDotClass(
                                day.progress,
                                isMuted,
                                day.hasWork,
                              ) + " h-[9px] w-[9px] rounded-full border transition-transform duration-150 hover:scale-[1.75]"}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--divider)" }}>
                    <div className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      <span>Less</span>
                      {[0, 25, 50, 75, 100].map((progress) => (
                        <span
                          key={progress}
                          className={
                            getHeatmapDotClass(progress, false, progress > 0) +
                            " h-[9px] w-[9px] rounded-full border"
                          }
                        />
                      ))}
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="year-guide-face"
                initial={{ opacity: 0, y: 8, scale: 0.992 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.992 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-4 md:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-faint)" }}>
                      Back to chart
                    </p>
                    <p className="mt-2 max-w-2xl text-[13px] font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      This heatmap shows your daily completion of tasks across the year. Blank days before signup and future dates stay visible but muted.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    {
                      label: "100%",
                      detail: "Dark green means the day is fully completed.",
                      progress: 100,
                    },
                    {
                      label: "67-99%",
                      detail: "Light green shows strong daily completion.",
                      progress: 80,
                    },
                    {
                      label: "34-66%",
                      detail: "Amber means the day is partially done.",
                      progress: 50,
                    },
                    {
                      label: "0-33%",
                      detail: "Orange means only a small part is completed.",
                      progress: 1,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-[10px] px-3 py-2.5"
                      style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)" }}
                    >
                      <span
                        className={`${getHeatmapDotClass(item.progress, false, true)} h-[10px] w-[10px] shrink-0 rounded-full border`}
                      />
                      <div>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                          {item.label}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <div className="mb-6">
        <PerformanceComparisonChart
          getItemsForDate={getItemsForDate}
          currentDate={currentDate}
        />
      </div>

      <section className="mb-2">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {profileActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + index * 0.04 }}
                onClick={action.onClick}
                className="group rounded-[13px] px-3.5 py-3 text-left transition-transform duration-200 hover:-translate-y-[1px] oryn-surface"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border ${action.iconClassName}`}>
                      <Icon className="h-[16px] w-[16px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-[15px] font-semibold tracking-[-0.02em]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {action.title}
                      </h3>
                      <div className="mt-1">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${action.chipClassName}`}>
                          {action.chip}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ color: "var(--text-faint)" }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

    </motion.div>
  );
}
