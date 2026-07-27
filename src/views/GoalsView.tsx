import React from "react";
import { motion } from "motion/react";
import { startOfDay } from "date-fns";
import { BarChart3, ChevronRight, Plus, Target, Calendar } from "lucide-react";
import { getGoalDeadlineMeta, parseLocalDateValue } from "../lib/goalDeadline";
import { getAccentColor } from "../lib/goalInsightsLogic";
import { cn } from "../lib/utils";
import type { Category, Goal, Milestone } from "../storage";
import type { ViewType } from "../hooks/useAppRouter";

type GoalsViewProps = {
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  setActiveGoalId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAddingGoal: React.Dispatch<React.SetStateAction<boolean>>;
  featuredGoalId: string | null;
  setFeaturedGoalId: React.Dispatch<React.SetStateAction<string | null>>;
  goals: Goal[];
  categories: Category[];
};

type GoalSectionFilter = "active" | "need-focus" | "completed";

const GOAL_FILTERS: { label: string; value: GoalSectionFilter }[] = [
  { label: "Active", value: "active" },
  { label: "Need focus", value: "need-focus" },
  { label: "Completed", value: "completed" },
];

const HERO_RING = 320.44;

function getCompactValue(goal: Goal, progressVal: number) {
  if ((goal.category || "").toLowerCase().includes("finance")) {
    const total = goal.note?.match(/₹[\d,]+/)?.[0];
    const saved = goal.note?.match(/saved[:\s-]+(₹[\d,]+)/i)?.[1];
    return saved || total || `${progressVal}%`;
  }
  return `${progressVal}%`;
}

function truncateText(text: string | undefined, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function GoalsView(props: GoalsViewProps) {
  const {
    setView,
    setActiveGoalId,
    setIsAddingGoal,
    featuredGoalId,
    setFeaturedGoalId,
    goals,
    categories,
  } = props;

  const cardSurface = "oryn-surface";
  const [sectionFilter, setSectionFilter] =
    React.useState<GoalSectionFilter>("active");

  const visibleGoals = React.useMemo(
    () => goals.filter((goal) => goal.title !== "General Tasks"),
    [goals],
  );

  const enrichedGoals = React.useMemo(() => {
    const today = startOfDay(new Date());

    return visibleGoals.map((goal) => {
      const category =
        categories.find((c) => c.name === goal.category) || {
          color: "#67b8ff",
          icon: "•",
        };
      const milestones = goal.milestones || [];
      const progressVal = Math.max(0, Math.min(100, Math.round(goal.progress || 0)));
      const deadlineMeta = getGoalDeadlineMeta({
        deadline: goal.deadline,
        progress: progressVal,
      });
      const milestoneDone = milestones.filter((m: Milestone) => m.done).length;
      const milestoneTotal = milestones.length;
      const remainingMilestones = Math.max(milestoneTotal - milestoneDone, 0);
      const nextMilestone =
        [...milestones]
          .filter((m: Milestone) => !m.done)
          .sort((a: Milestone, b: Milestone) => {
            const aTime = a?.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b?.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
          })[0] || null;
      const nextMilestoneDueDate = parseLocalDateValue(nextMilestone?.due_date);
      const milestoneNeedsFocus =
        Boolean(nextMilestoneDueDate) &&
        nextMilestoneDueDate!.getTime() <= today.getTime();
      const { daysLeft } = deadlineMeta;
      const needsAttention =
        milestoneNeedsFocus ||
        deadlineMeta.needsAttention ||
        (goal.priority === "High" && progressVal < 45);
      const accent = getAccentColor(goal, category.color || "#67b8ff");

      let score = 0;
      if (progressVal < 100) score += 140;
      if (goal.priority === "High") score += 40;
      if (goal.priority === "Medium") score += 20;
      if (daysLeft !== null && daysLeft < 0) score += 70;
      if (daysLeft !== null && daysLeft >= 0) score += Math.max(0, 15 - daysLeft);
      score += remainingMilestones * 3;
      score += Math.max(0, 100 - progressVal) * 0.25;

      const isNonRepeatingGoal = !goal.repeat || goal.repeat === "None";
      const hasNoMilestones = milestoneTotal === 0;
      if (isNonRepeatingGoal && hasNoMilestones && progressVal < 100) {
        score += 50;
      }

      return {
        ...goal,
        category,
        accent,
        progressVal,
        milestoneDone,
        milestoneTotal,
        nextMilestone,
        nextMilestoneDueDate,
        milestoneNeedsFocus,
        daysLeft,
        deadlineMeta,
        needsAttention,
        dueText: deadlineMeta.dueText,
        compactDueText: deadlineMeta.compactDueText,
        compactMetaLeft: nextMilestone
          ? `Next: ${nextMilestone.title}`
          : milestoneTotal > 0
            ? `${milestoneDone} / ${milestoneTotal} completed`
            : "Add milestones",
        heroMeta: nextMilestone
          ? `Next: ${truncateText(nextMilestone.title, 22)}`
          : progressVal >= 100
            ? "All milestones complete"
            : "No milestone scheduled yet",
        summaryValue: getCompactValue(goal, progressVal),
        statusLabel: progressVal >= 100
          ? "Completed"
          : deadlineMeta.isOverdue
            ? "Overdue"
            : milestoneNeedsFocus
              ? "Needs focus"
            : deadlineMeta.isDueSoon
              ? "Due Soon"
              : needsAttention
                ? "Needs focus"
                : (isNonRepeatingGoal && hasNoMilestones)
                  ? "Needs planning"
                  : "On track",
        dueToneClass: deadlineMeta.isOverdue
          ? "text-rose-300"
          : deadlineMeta.isDueSoon
            ? "text-amber-200"
            : "",
        dueToneStyle: deadlineMeta.isOverdue || deadlineMeta.isDueSoon
          ? undefined
          : { color: "var(--text-secondary)" },
        compactDueToneClass: deadlineMeta.isOverdue
          ? "text-rose-300"
          : deadlineMeta.isDueSoon
            ? "text-amber-200"
            : "",
        compactDueToneStyle: deadlineMeta.isOverdue || deadlineMeta.isDueSoon
          ? undefined
          : { color: "var(--text-secondary)" },
        score,
      };
    });
  }, [categories, visibleGoals]);

  const sortedGoals = React.useMemo(
    () => [...enrichedGoals].sort((a, b) => b.score - a.score),
    [enrichedGoals],
  );

  const featuredGoal =
    sortedGoals.find((goal) => goal.id === featuredGoalId) || sortedGoals[0] || null;

  const filteredGoals = React.useMemo(() => {
    if (sectionFilter === "completed") {
      return sortedGoals.filter((goal) => goal.progressVal >= 100);
    }

    if (sectionFilter === "need-focus") {
      return sortedGoals.filter(
        (goal) => goal.progressVal < 100 && goal.needsAttention,
      );
    }

    return sortedGoals.filter((goal) => goal.progressVal < 100);
  }, [sectionFilter, sortedGoals]);

  const compactGoals = React.useMemo(() => {
    return featuredGoal
      ? filteredGoals.filter((goal) => goal.id !== featuredGoal.id)
      : filteredGoals;
  }, [featuredGoal, filteredGoals]);

  const emptyFilterMessage =
    sectionFilter === "active"
      ? "No active goals right now."
      : sectionFilter === "need-focus"
        ? "No goals need focus right now."
      : sectionFilter === "completed"
        ? "No completed goals yet."
        : "No goals yet.";

  const openGoal = (goalId: string) => {
    setActiveGoalId(goalId);
    setView("detail");
  };

  const openInsights = () => {
    if (featuredGoal) {
      setActiveGoalId(featuredGoal.id);
    }
    setView("goal-insights");
  };

  return (
    <motion.div
      key="goals"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen px-2 pb-36 pt-4 md:px-8 md:pb-10"
      style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}
    >
      <div className="relative mx-auto w-full max-w-5xl pb-24">
          <div className="h-4" aria-hidden="true" />

          <div className="space-y-[18px] px-2 pb-28 pt-[10px]">
            {visibleGoals.length === 0 ? (
              <div className="rounded-xl px-6 py-12 text-center oryn-surface">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)" }}>
                  <Target className="h-8 w-8" style={{ color: "var(--text-secondary)" }} />
                </div>
                <h3 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  No goals yet
                </h3>
                <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Big achievements start with small wins. Let's create your first goal.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(true)}
                  className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-orange-300/18 bg-orange-400/12 px-5 text-[12px] font-semibold text-orange-100 transition-colors hover:bg-orange-400/18"
                >
                  <Plus className="h-4 w-4" />
                  Create Goal
                </button>
              </div>
            ) : (
              <>
                {featuredGoal && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 }}
                    onClick={() => openGoal(featuredGoal.id)}
                    className={`relative overflow-hidden rounded-xl px-4 py-4 backdrop-blur-[20px] ${cardSurface}`}
                  >
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 82% 14%, color-mix(in srgb, ${featuredGoal.accent} var(--goal-feature-accent-strength), transparent) 0%, transparent 22%), var(--goal-feature-overlay)`,
                      }}
                    />

                    <div className="relative flex min-h-[104px] items-center gap-3">
                      <div className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center">
                        <div
                          className="absolute inset-[14px] rounded-full blur-[18px]"
                          style={{ backgroundColor: `${featuredGoal.accent}14` }}
                        />
                        <svg className="relative h-[104px] w-[104px] -rotate-90" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="51"
                            fill="none"
                            stroke="transparent"
                            strokeWidth="10"
                            style={{ stroke: "var(--goal-feature-ring-track)" }}
                          />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="51"
                            fill="none"
                            stroke={featuredGoal.accent}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={HERO_RING}
                            initial={{ strokeDashoffset: HERO_RING }}
                            animate={{
                              strokeDashoffset:
                                HERO_RING - (HERO_RING * featuredGoal.progressVal) / 100,
                            }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                              filter: `drop-shadow(0 0 10px ${featuredGoal.accent}28)`,
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className={`font-extrabold leading-none ${
                              featuredGoal.progressVal >= 100
                                ? "text-[20px] tracking-[-0.03em]"
                                : "text-[24px] tracking-[-0.04em]"
                            }`}
                            style={{ color: "var(--text-primary)" }}
                          >
                            {featuredGoal.progressVal}%
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pr-1">
                        <h2
                          className="overflow-hidden text-[20px] font-bold leading-[1.05] tracking-[-0.03em] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                          style={{ color: "var(--text-primary)" }}
                          title={featuredGoal.title}
                        >
                          {featuredGoal.title}
                        </h2>
                        <p className="mt-1.5 text-[14px] font-medium" style={{ color: "var(--text-secondary)" }}>
                          {featuredGoal.progressVal}% Complete
                        </p>
                        <div className="mt-2 h-px w-full" style={{ background: "var(--divider)" }} />
                        <p
                          className="mt-2 overflow-hidden text-[13px] leading-[1.35] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                          style={{ color: "var(--text-secondary)" }}
                          title={featuredGoal.heroMeta}
                        >
                          {featuredGoal.heroMeta}
                        </p>
                        <p className={`mt-1.5 text-[13px] ${featuredGoal.dueToneClass}`} style={featuredGoal.dueToneStyle}>
                          {featuredGoal.dueText}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <section className="pt-1">
                  <div className="flex items-center gap-2 px-[1px]">
                    <div className="flex min-w-0 items-center gap-2 overflow-x-auto custom-scrollbar">
                      {GOAL_FILTERS.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          aria-pressed={sectionFilter === item.value}
                          onClick={() => setSectionFilter(item.value)}
                          className={cn(
                            "whitespace-nowrap rounded-lg border px-3 py-1.5 text-[12px] font-medium tracking-wide transition-all duration-200 sm:px-4",
                          )}
                          style={
                            sectionFilter === item.value
                              ? { background: "var(--pill-active-bg)", border: "1px solid var(--pill-active-border)", color: "var(--pill-active-text)" }
                              : { background: "var(--pill-inactive-bg)", border: "1px solid var(--pill-inactive-border)", color: "var(--pill-inactive-text)" }
                          }
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingGoal(true)}
                      className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#87c4ff]/20 bg-[#87c4ff]/10 text-[#87c4ff] transition-colors duration-200 hover:bg-[#87c4ff]/14"
                      aria-label="Add new goal"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-[10px] space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-2.5">
                    {filteredGoals.length === 0 ? (
                      <div className={`rounded-xl px-4 py-5 text-[13px] ${cardSurface}`} style={{ color: "var(--text-secondary)" }}>
                        {emptyFilterMessage}
                      </div>
                    ) : (
                      compactGoals.map((goal, index) => (
                        <motion.button
                          key={goal.id}
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 + index * 0.03 }}
                          onClick={() => openGoal(goal.id)}
                          className={`relative flex min-h-[70px] w-full items-start gap-2.5 overflow-hidden rounded-xl px-4 py-[11px] text-left backdrop-blur-[15px] ${cardSurface}`}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_8%,rgba(255,255,255,0.04),transparent_22%)]" />
                          <div
                            className="relative mt-[2px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[6px] border"
                            style={{ borderColor: "var(--surface-border)", backgroundColor: `${goal.accent}14` }}
                          >
                            <span
                              className="block h-[7px] w-[7px] rounded-[3px]"
                              style={{ backgroundColor: goal.accent }}
                            />
                          </div>

                          <div className="relative min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-[14px] font-semibold tracking-[-0.01em]" style={{ color: "var(--text-primary)" }}>
                                {goal.title}
                              </p>
                              <span className="shrink-0 text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                                {goal.summaryValue}
                              </span>
                            </div>

                            <div className="mt-2 h-[3px] overflow-hidden rounded-full" style={{ background: "var(--progress-track)" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${goal.progressVal}%` }}
                                transition={{ duration: 0.8, delay: 0.08 + index * 0.03 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: goal.accent }}
                              />
                            </div>

                            <div className="mt-[9px] flex items-center justify-between gap-3 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                              <p className="truncate">{goal.compactMetaLeft}</p>
                              <p className={`shrink-0 ${goal.compactDueToneClass}`} style={goal.compactDueToneStyle}>
                                {goal.compactDueText}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </section>

                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  onClick={openInsights}
                  className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-4 py-3.5 text-left backdrop-blur-[18px] ${cardSurface}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_50%,rgba(103,184,255,0.12),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.05),transparent_22%)]" />
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-sky-300/14 bg-sky-400/[0.08] text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <BarChart3 className="h-[17px] w-[17px]" />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                      Dashboard
                    </p>
                    <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>
                      View goal progress
                    </p>
                  </div>

                  <ChevronRight className="relative h-[18px] w-[18px] shrink-0 transition-colors" style={{ color: "var(--text-secondary)" }} />
                </motion.button>

                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setView("assign-tasks")}
                  className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-4 py-3.5 text-left backdrop-blur-[18px] mt-2.5 ${cardSurface}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_50%,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.05),transparent_22%)]" />
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-orange-300/14 bg-orange-400/[0.08] text-orange-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Calendar className="h-[17px] w-[17px]" />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                      Assign Tasks
                    </p>
                    <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>
                      Assign milestones to calendar
                    </p>
                  </div>

                  <ChevronRight className="relative h-[18px] w-[18px] shrink-0 transition-colors" style={{ color: "var(--text-secondary)" }} />
                </motion.button>
              </>
            )}
          </div>
      </div>
    </motion.div>
  );
}
