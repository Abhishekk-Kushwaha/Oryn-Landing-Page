import React from "react";
import { format, isAfter, parseISO, subDays } from "date-fns";
import { motion } from "motion/react";
import {
  Archive,
  ArrowLeft,
  RotateCcw,
  Target,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import type { ViewType } from "../hooks/useAppRouter";
import type { Category, Goal, Habit } from "../storage";

type ArchiveViewProps = {
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  currentDate: Date;
  archivedGoals: Goal[];
  archivedHabits: Habit[];
  categories: Category[];
  handleRestoreGoal: (id: string) => Promise<void>;
  handleRestoreHabit: (id: string) => Promise<void>;
};

export function ArchiveView(props: ArchiveViewProps) {
  const {
    setView,
    currentDate,
    archivedGoals,
    archivedHabits,
    categories,
    handleRestoreGoal,
    handleRestoreHabit,
  } = props;

  const categoryByName = React.useMemo(() => {
    return new Map(categories.map((category) => [category.name, category]));
  }, [categories]);

  const archiveWindowStart = React.useMemo(() => subDays(currentDate, 15), [currentDate]);
  const archivedItemCount = archivedGoals.length + archivedHabits.length;
  const archivedItemLabel = `${archivedItemCount} ${archivedItemCount === 1 ? "item" : "items"}`;

  const getRecentCompletionCount = (habit: Habit) => {
    return (habit.completed_dates || []).filter((date) => {
      const completedDate = parseISO(date);
      return isAfter(completedDate, archiveWindowStart);
    }).length;
  };

  const getRecentGoalPerformanceCount = (goal: Goal) => {
    const goalRepeats = (goal.completed_dates || []).filter((date) =>
      isAfter(parseISO(date), archiveWindowStart),
    ).length;

    const milestoneCompletions = goal.milestones.reduce((count, milestone) => {
      if (milestone.repeat && milestone.repeat !== "None") {
        return count + (milestone.completed_dates || []).filter((date) =>
          isAfter(parseISO(date), archiveWindowStart),
        ).length;
      }

      if (milestone.done && milestone.completed_at) {
        return isAfter(parseISO(milestone.completed_at), archiveWindowStart)
          ? count + 1
          : count;
      }

      return count;
    }, 0);

    return goalRepeats + milestoneCompletions;
  };

  return (
    <motion.div
      key="archive"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8 max-w-6xl mx-auto w-full"
      style={{ color: "var(--text-primary)" }}
    >
      <header className="mb-8 flex flex-col gap-5 md:mb-10">
        <button
          type="button"
          onClick={() => setView("dashboard")}
          className="flex h-10 w-max items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors"
          style={{
            border: "1px solid var(--surface-border)",
            background: "var(--hover-overlay)",
            color: "var(--text-secondary)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Profile
        </button>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-orange-300/62">
              Deleted Items
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl" style={{ color: "var(--text-primary)" }}>
              Archive
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6" style={{ color: "var(--text-muted)" }}>
              Restore deleted goals and habits within 15 days.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            {[
              { label: "Total", value: archivedItemLabel },
              { label: "Goals", value: archivedGoals.length },
              { label: "Habits", value: archivedHabits.length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[10px] px-3 py-2"
                style={{ border: "1px solid var(--surface-border)", background: "var(--stat-cell-bg)" }}
              >
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--text-faint)" }}>
                  {stat.label}
                </p>
                <p className="mt-1 truncate text-[17px] font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <Card
        className="overflow-hidden border border-orange-300/12 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_34%),linear-gradient(145deg,rgba(18,21,25,0.98),rgba(8,10,13,0.99))] shadow-[0_24px_70px_-44px_rgba(249,115,22,0.45)]"
        delay={0.14}
      >
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          <section className="border-b p-4 md:p-5 lg:border-b-0 lg:border-r" style={{ borderColor: "var(--surface-border)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-300/82" />
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-secondary)" }}>
                    Goal Archive
                  </h3>
                </div>
                <p className="mt-1 text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                  Progress and milestones stay intact.
                </p>
              </div>
              <span className="rounded-[9px] px-2.5 py-1 text-[11px] font-semibold" style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}>
                {archivedGoals.length}
              </span>
            </div>

            {archivedGoals.length === 0 ? (
              <div className="mt-4 rounded-[10px] px-3 py-3 text-[12px] font-medium" style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-muted)" }}>
                No archived goals right now.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-2">
                {archivedGoals.map((goal) => {
                  const category = categoryByName.get(goal.category);
                  const performanceCount = getRecentGoalPerformanceCount(goal);
                  const completedMilestones = goal.milestones.filter((milestone) => milestone.done).length;

                  return (
                    <div
                      key={goal.id}
                      className="flex flex-col gap-3 rounded-[10px] p-3 sm:flex-row sm:items-center sm:justify-between"
                      style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)" }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border text-[15px]"
                          style={{
                            backgroundColor: `${category?.color || "#f97316"}18`,
                            borderColor: `${category?.color || "#f97316"}44`,
                          }}
                        >
                          {category?.icon || "*"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {goal.title}
                          </h4>
                          <p className="mt-0.5 truncate text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                            {goal.category} / {goal.progress}% progress / {completedMilestones}/{goal.milestones.length} milestones
                          </p>
                          <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>
                            {performanceCount} recent wins / Until {goal.archive_expires_at ? format(parseISO(goal.archive_expires_at), "MMM d") : "soon"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRestoreGoal(goal.id)}
                        className="h-9 shrink-0 rounded-[9px] border border-orange-300/18 bg-orange-400/10 px-3 text-[12px] font-bold text-orange-200 transition-colors hover:border-orange-200/28 hover:bg-orange-400/14"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-orange-300/82" />
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-secondary)" }}>
                    Habit Archive
                  </h3>
                </div>
                <p className="mt-1 text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                  Completion history stays saved.
                </p>
              </div>
              <span className="rounded-[9px] px-2.5 py-1 text-[11px] font-semibold" style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}>
                {archivedHabits.length}
              </span>
            </div>

            {archivedHabits.length === 0 ? (
              <div className="mt-4 rounded-[10px] px-3 py-3 text-[12px] font-medium" style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-muted)" }}>
                No archived habits right now.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-2">
                {archivedHabits.map((habit) => {
                  const category = categoryByName.get(habit.category);
                  const completionCount = getRecentCompletionCount(habit);

                  return (
                    <div
                      key={habit.id}
                      className="flex flex-col gap-3 rounded-[10px] p-3 sm:flex-row sm:items-center sm:justify-between"
                      style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)" }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border text-[15px]"
                          style={{
                            backgroundColor: `${habit.color || category?.color || "#f97316"}18`,
                            borderColor: `${habit.color || category?.color || "#f97316"}44`,
                          }}
                        >
                          {category?.icon || "*"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {habit.title}
                          </h4>
                          <p className="mt-0.5 truncate text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                            {habit.category} / {habit.repeat} / {completionCount} completions in 15 days
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>
                            Until {habit.archive_expires_at ? format(parseISO(habit.archive_expires_at), "MMM d") : "soon"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRestoreHabit(habit.id)}
                        className="h-9 shrink-0 rounded-[9px] border border-orange-300/18 bg-orange-400/10 px-3 text-[12px] font-bold text-orange-200 transition-colors hover:border-orange-200/28 hover:bg-orange-400/14"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </Card>
    </motion.div>
  );
}
