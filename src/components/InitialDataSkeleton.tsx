import React from "react";
import type { CSSProperties } from "react";
import type { ViewType } from "../hooks/useAppRouter";

const surface = "relative overflow-hidden rounded-xl oryn-skeleton";
const shimmer =
  "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.45s_infinite] oryn-skeleton-shimmer";
const block = "relative overflow-hidden rounded-lg";

function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
  key?: React.Key;
}) {
  return <div className={`${block} ${shimmer} ${className}`} style={style} />;
}

function StatSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`${surface} p-5 md:p-6`}>
          <SkeletonBlock className="mb-6 h-10 w-10 rounded-xl" />
          <SkeletonBlock className="mb-3 h-3 w-24" />
          <SkeletonBlock className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ compact = false }: { compact?: boolean }) {
  const bars = compact ? [64, 92, 58, 78, 44] : [56, 86, 68, 112, 74, 96, 52];

  return (
    <div className={`${surface} p-6 md:p-8`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <SkeletonBlock className="mb-3 h-3 w-32" />
          <SkeletonBlock className="h-3 w-44" />
        </div>
        <SkeletonBlock className="h-7 w-20 rounded-full" />
      </div>
      <div className="flex h-[220px] items-end gap-4 border-b px-2 pb-4" style={{ borderColor: "var(--surface-border)" }}>
        {bars.map((height, index) => (
          <SkeletonBlock
            key={index}
            className="w-full rounded-t-lg"
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}

function ListRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${surface} flex min-h-[72px] items-center gap-3 p-4`}>
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="mb-3 h-4 w-3/5" />
            <SkeletonBlock className="h-3 w-4/5" />
          </div>
          <SkeletonBlock className="h-8 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8 md:mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <SkeletonBlock className="mb-3 h-8 w-40" />
          <SkeletonBlock className="h-4 w-56" />
        </div>
        <SkeletonBlock className="h-10 w-44 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <StatSkeletons />
        </div>
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <div>
          <div className={`${surface} p-6 md:p-8`}>
            <SkeletonBlock className="mb-8 h-3 w-28" />
            <div className="mx-auto mb-8 h-[180px] w-[180px] rounded-full border-[18px]" style={{ borderColor: "var(--skeleton-circle-border)" }} />
            <ListRows count={3} />
          </div>
        </div>
        <div className="lg:col-span-3">
          <ChartSkeleton />
        </div>
      </div>
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden px-4 pb-56 pt-5 md:px-8 md:pb-10" style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--page-overlay)" }} />
      <div className="relative mx-auto flex w-full max-w-[430px] flex-col gap-5 md:max-w-3xl">
        <ChartSkeleton compact />
        <div className={`${surface} p-4`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <SkeletonBlock className="mb-3 h-7 w-36" />
              <SkeletonBlock className="h-4 w-44" />
            </div>
            <div className="h-[84px] w-[84px] shrink-0 rounded-full border-[10px]" style={{ borderColor: "var(--skeleton-circle-border)" }} />
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <SkeletonBlock className="h-5 w-20" />
            <SkeletonBlock className="h-4 w-14" />
          </div>
          <ListRows count={3} />
        </div>
      </div>
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="relative min-h-screen px-2 pb-36 pt-4 md:px-8 md:pb-10" style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}>
      <div className="relative mx-auto w-full max-w-5xl pb-24">
        <header className="relative flex h-[76px] items-center justify-between px-2">
          <SkeletonBlock className="h-11 w-11 rounded-full" />
          <SkeletonBlock className="h-6 w-20" />
          <SkeletonBlock className="h-11 w-11 rounded-full" />
        </header>
        <div className="space-y-[18px] px-2 pb-28 pt-[10px]">
          <div className={`${surface} flex h-[82px] items-center gap-4 p-4`}>
            <div className="h-[42px] w-[42px] rounded-full border-4" style={{ borderColor: "var(--skeleton-circle-border)" }} />
            <div className="flex-1">
              <SkeletonBlock className="mb-3 h-4 w-40" />
              <SkeletonBlock className="h-3 w-64 max-w-full" />
            </div>
          </div>
          <div className={`${surface} flex min-h-[136px] items-center gap-4 p-4`}>
            <div className="h-[104px] w-[104px] shrink-0 rounded-full border-[10px]" style={{ borderColor: "var(--skeleton-circle-border)" }} />
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="mb-3 h-6 w-3/4" />
              <SkeletonBlock className="mb-4 h-4 w-28" />
              <SkeletonBlock className="mb-3 h-px w-full" />
              <SkeletonBlock className="mb-3 h-4 w-full" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
          </div>
          <SkeletonBlock className="h-5 w-28" />
          <ListRows count={4} />
        </div>
      </div>
    </div>
  );
}

function HabitsSkeleton() {
  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto w-full flex flex-col gap-5 md:gap-10 pb-28 md:pb-32 min-h-screen pt-5 md:pt-16">
      <div className={`${surface} min-h-[148px] p-6`}>
        <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-5">
          <div className="h-[60px] w-[60px] rounded-full border-[7px]" style={{ borderColor: "var(--skeleton-circle-border)" }} />
          <div>
            <SkeletonBlock className="mb-3 h-8 w-40" />
            <SkeletonBlock className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <SkeletonBlock className="mt-6 h-1 w-full rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-8 w-14" />
        <SkeletonBlock className="h-8 w-24" />
        <SkeletonBlock className="h-8 w-24" />
        <SkeletonBlock className="ml-auto h-8 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-6 lg:grid-cols-2">
        <ListRows count={4} />
      </div>
    </div>
  );
}

function PlannerCalendarSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <SkeletonBlock className="mb-3 h-8 w-40" />
          <SkeletonBlock className="h-4 w-56" />
        </div>
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className={`${surface} p-5`}>
          <div className="mb-5 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <SkeletonBlock key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div>
          <ListRows count={5} />
        </div>
      </div>
    </div>
  );
}

export function InitialDataSkeleton({ view }: { view: ViewType; key?: React.Key }) {
  if (view === "today") return <TodaySkeleton />;
  if (view === "dashboard" || view === "archive") return <DashboardSkeleton />;
  if (view === "goals" || view === "detail") return <GoalsSkeleton />;
  if (view === "habits") return <HabitsSkeleton />;
  if (view === "planner" || view === "calendar" || view === "assign-tasks") {
    return <PlannerCalendarSkeleton />;
  }
  return <DashboardSkeleton />;
}
