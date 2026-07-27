import React from "react";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function CircularProgress({
  progress,
  size = 160,
  strokeWidth = 12,
  color = "#f97316", // Default orange
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const roundedProgress = Math.round(progress);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center font-mono-nums"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          style={{ color: "var(--progress-track-light)" }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-black leading-none whitespace-nowrap",
            roundedProgress >= 100
              ? size < 70
                ? "text-[14px]"
                : size < 100
                  ? "text-[16px]"
                  : size < 120
                    ? "text-[20px]"
                    : "text-[32px]"
              : size < 70
                ? "text-[17px]"
                : size < 100
                  ? "text-xl"
                  : size < 120
                    ? "text-2xl"
                    : "text-4xl",
          )}
          style={{ color: "var(--text-primary)" }}
        >
          {roundedProgress}%
        </span>
        {size > 120 && (
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Complete
          </span>
        )}
      </div>
    </div>
  );
}
