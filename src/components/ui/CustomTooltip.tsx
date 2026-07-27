import React from "react";

type TooltipItem = {
  value?: number | string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
};

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const firstValue = payload[0]?.value;
    return (
      <div className="p-3 rounded-xl shadow-xl backdrop-blur-md" style={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)" }}>
        <p className="text-[9px] font-semibold tracking-widest uppercase uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {firstValue}{" "}
            {firstValue === 1 ? "Completion" : "Completions"}
          </p>
        </div>
      </div>
    );
  }
  return null;
};
