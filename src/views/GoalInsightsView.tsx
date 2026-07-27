import React from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import { buildGoalInsightsChartsModel } from "../lib/goalInsightsLogic";
import type { Category, Goal } from "../storage";
import type { ViewType } from "../hooks/useAppRouter";

type GoalInsightsViewProps = {
  goals: Goal[];
  categories: Category[];
  activeGoalId: string | null;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  setActiveGoalId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAddingGoal: React.Dispatch<React.SetStateAction<boolean>>;
};

const CHART_CARD_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--surface-border)",
  boxShadow: "var(--surface-shadow)",
} as const;

const CARD_TITLE_STYLE = {
  color: "var(--text-primary)",
} as const;

const CARD_TEXT_STYLE = {
  color: "var(--text-secondary)",
} as const;

const CARD_MUTED_TEXT_STYLE = {
  color: "var(--text-muted)",
} as const;

const RADAR_COLOR = "#22e07a";
const GRID_COLOR = "var(--surface-border)";
const RADIAL_TRACK_COLOR = "var(--progress-track-light)";

function InsightCard(props: React.PropsWithChildren<{ title: string }>) {
  return (
    <section
      className="rounded-xl px-5 py-5 oryn-surface"
      style={CHART_CARD_STYLE}
    >
      <h2
        className="text-center text-[14px] font-semibold tracking-[-0.02em]"
        style={CARD_TITLE_STYLE}
      >
        {props.title}
      </h2>
      <div className="mt-4">{props.children}</div>
    </section>
  );
}

export function GoalInsightsView(props: GoalInsightsViewProps) {
  const { goals, categories, setView } = props;

  const goBack = () => setView("goals");
  const chartsModel = React.useMemo(
    () => buildGoalInsightsChartsModel(goals, categories),
    [categories, goals],
  );
  const radarLabelByTitle = React.useMemo(
    () => new Map(chartsModel.radarData.map((item) => [item.fullTitle, item])),
    [chartsModel.radarData],
  );
  const renderRadarTick = React.useCallback(
    (tickProps: {
      x?: string | number;
      y?: string | number;
      textAnchor?: "end" | "start" | "inherit" | "middle";
      payload?: { value?: string };
    }) => {
      const fullTitle = String(tickProps.payload?.value || "");
      const radarItem = radarLabelByTitle.get(fullTitle);
      if (tickProps.x === undefined || tickProps.y === undefined) return null;

      const x = Number(tickProps.x);
      const y = Number(tickProps.y);

      return (
        <text
          x={x}
          y={y}
          textAnchor={tickProps.textAnchor || "middle"}
          dominantBaseline="central"
          fill={radarItem?.color || "var(--text-secondary)"}
          fontSize={11}
          fontWeight={600}
        >
          {radarItem?.shortLabel || fullTitle}
        </text>
      );
    },
    [radarLabelByTitle],
  );
  const renderRadarDot = React.useCallback(
    (dotProps: { cx?: number; cy?: number; payload?: { color?: string } }) => {
      if (dotProps.cx === undefined || dotProps.cy === undefined) return null;

      return (
        <circle
          cx={dotProps.cx}
          cy={dotProps.cy}
          r={3}
          fill={dotProps.payload?.color || RADAR_COLOR}
          stroke="none"
        />
      );
    },
    [],
  );

  return (
    <motion.div
      key="goal-insights"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="relative min-h-screen w-full overflow-x-hidden px-3 py-4 pb-56 md:px-6 md:pb-10"
      style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--page-overlay)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--page-radial)" }} />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex items-center gap-3 px-1">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors"
            style={{
              border: "1px solid var(--surface-border)",
              background: "var(--hover-overlay)",
              color: "var(--text-secondary)",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex-1 text-center">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--text-muted)" }}
            >
              Goal Insights
            </p>
            <h1
              className="mt-1 text-[20px] font-bold tracking-[-0.04em]"
              style={{ color: "var(--text-primary)" }}
            >
              Dashboard
            </h1>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[340px] flex-col gap-5">
          {chartsModel.isEmpty ? (
            <section
              className="rounded-xl px-5 py-6 text-center oryn-surface"
              style={CHART_CARD_STYLE}
            >
              <h2
                className="text-[16px] font-semibold tracking-[-0.02em]"
                style={CARD_TITLE_STYLE}
              >
                All visible goals are complete
              </h2>
              <p
                className="mt-3 text-[12px] leading-6"
                style={CARD_MUTED_TEXT_STYLE}
              >
                Charts appear here when at least one goal is below 100%.
              </p>
            </section>
          ) : (
            <>
              <InsightCard title="Goal Progress Radar">
                <div className="h-[185px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={chartsModel.radarData}
                      margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
                    >
                      <PolarGrid stroke={GRID_COLOR} radialLines />
                      <PolarAngleAxis
                        dataKey="fullTitle"
                        tick={renderRadarTick}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        dataKey="progress"
                        stroke={RADAR_COLOR}
                        fill={RADAR_COLOR}
                        fillOpacity={0.18}
                        strokeWidth={2}
                        dot={renderRadarDot}
                        isAnimationActive={false}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </InsightCard>

              <InsightCard title="Top Goals Progress">
                <div className="flex items-center gap-4">
                  <div className="h-[148px] w-[148px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        data={chartsModel.radialChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="22%"
                        outerRadius="96%"
                        barSize={10}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <RadialBar
                          dataKey="progress"
                          background={{ fill: RADIAL_TRACK_COLOR }}
                          cornerRadius={999}
                          isAnimationActive={false}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    {chartsModel.legendItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: item.color }}
                          />
                          <span
                            className="min-w-0 flex-1 truncate text-[12px] font-medium"
                            style={CARD_TEXT_STYLE}
                            title={item.title}
                          >
                            {item.title}
                          </span>
                        </div>
                        <span
                          className="shrink-0 text-[12px] font-semibold"
                          style={CARD_TITLE_STYLE}
                        >
                          {item.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </InsightCard>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
