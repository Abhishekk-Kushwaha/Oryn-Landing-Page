import React from "react";

type BarTooltipItem = {
  fill?: string;
  name?: string;
  value?: number | string;
};

type CustomBarTooltipProps = {
  active?: boolean;
  payload?: BarTooltipItem[];
  label?: string | number;
};

export const CustomBarTooltip = ({
  active,
  payload,
  label,
}: CustomBarTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl shadow-xl backdrop-blur-md" style={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)" }}>
        <p className="text-[9px] font-semibold tracking-widest uppercase uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        {payload.map((p, i: number) => (
          <div key={i} className="flex items-center gap-2 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.fill || "var(--text-faint)" }}
            />
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {p.name}: {p.value}%
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
