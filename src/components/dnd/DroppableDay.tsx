import React from "react";
import { motion } from "motion/react";
import { format, isToday } from "date-fns";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Milestone } from "../../storage";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AssignableMilestone = Milestone & {
  goalTitle: string;
};

type CalendarDayMilestone = {
  id: string;
  title: string;
  done?: boolean;
  isHabit?: boolean;
};

/* ─── Draggable milestone inside a calendar cell ─── */
export function DraggableCalendarMilestone({
  milestone,
  goalTitle,
  onUnassign,
}: {
  milestone: Milestone;
  goalTitle: string;
  onUnassign?: (id: string) => void;
  key?: React.Key;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: milestone.id,
    data: { milestone, goalTitle },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1, touchAction: "none" }}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative px-1 py-0.5 rounded-[5px] bg-orange-500/[0.12] border border-orange-400/20 cursor-grab active:cursor-grabbing touch-none transition-colors pr-4",
        isDragging && "border-orange-400/50 bg-orange-500/[0.06] z-50",
      )}
    >
      <p className="text-[7px] md:text-[8px] font-semibold text-orange-300 truncate leading-tight">
        {milestone.title}
      </p>
      {onUnassign && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnassign(milestone.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 p-0.5 text-orange-400/50 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─── Droppable day cell used in full calendar view ─── */
export function DroppableDay({
  day,
  isCurrentMonth,
  milestones,
  onUnassign,
}: {
  day: Date;
  isCurrentMonth: boolean;
  milestones: AssignableMilestone[];
  onUnassign?: (id: string) => void;
  key?: React.Key;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: format(day, "yyyy-MM-dd"),
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[80px] md:min-h-[140px] p-1 md:p-3 rounded-xl border transition-all duration-200 flex flex-col",
        !isCurrentMonth && "opacity-25",
        isOver
          ? "bg-orange-500/[0.08] border-orange-400/40 scale-[1.02] z-10"
          : "",
        isToday(day) && !isOver && "border-orange-400/30",
      )}
      style={isOver ? undefined : { background: "var(--hover-overlay)", borderColor: "var(--surface-border)" }}
    >
      <div className="flex justify-between items-start mb-1 md:mb-2">
        <span
          className={cn(
            "text-[9px] md:text-[10px] font-bold tracking-widest uppercase",
            isToday(day)
              ? "text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]"
              : "",
          )}
          style={isToday(day) ? undefined : { color: "var(--text-secondary)" }}
        >
          {format(day, "d")}
        </span>
        {milestones.length > 0 && (
          <span className="text-[8px] font-semibold px-1 py-0.5 rounded hidden sm:inline-block" style={{ color: "var(--text-faint)", background: "var(--hover-overlay)" }}>
            {milestones.length}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {milestones.slice(0, 4).map((ms) => (
          <DraggableCalendarMilestone
            key={ms.id}
            milestone={ms}
            goalTitle={ms.goalTitle}
            onUnassign={onUnassign}
          />
        ))}
        {milestones.length > 4 && (
          <p className="text-[8px] font-semibold text-center" style={{ color: "var(--text-faint)" }}>
            +{milestones.length - 4}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Droppable + clickable calendar day (compact grid) ─── */
export function DroppableCalendarDay({
  day,
  isCurrentMonth,
  isSelected,
  isTodayDay,
  dayMilestones,
  onClick,
}: {
  day: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isTodayDay: boolean;
  dayMilestones: CalendarDayMilestone[];
  onClick: () => void;
  key?: React.Key;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: format(day, "yyyy-MM-dd"),
  });

  // Dots only represent tasks/milestones — exclude habits since they appear
  // on every day and dilute the visual meaning of the indicators.
  const taskMilestones = dayMilestones.filter((m) => !m.isHabit);
  const hasMilestones = taskMilestones.length > 0;
  const allDone = hasMilestones && taskMilestones.every((m) => m.done);

  return (
    <motion.button
      ref={setNodeRef}
      key={day.toString()}
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        "aspect-square relative flex flex-col items-center justify-center rounded-[11px] transition-all duration-150 group",
        !isCurrentMonth && "opacity-20",
        isSelected
          ? "bg-orange-500 shadow-[0_6px_20px_-8px_rgba(249,115,22,0.7)]"
          : isTodayDay
          ? "bg-orange-500/[0.09] border border-orange-400/30"
          : "",
        isOver && "ring-2 ring-orange-400/60 ring-offset-1 ring-offset-[#090b0f] scale-[1.06] z-10",
      )}
      style={!isSelected && !isTodayDay ? { background: "var(--hover-overlay)", borderColor: "var(--surface-border)" } : undefined}
    >
      <span
        className={cn(
          "text-[13px] font-bold leading-none",
          isSelected
            ? "text-[#3a1205]"
            : isTodayDay
            ? "text-orange-400"
            : "",
        )}
        style={!isSelected && !isTodayDay ? { color: "var(--text-secondary)" } : undefined}
      >
        {format(day, "d")}
      </span>

      {hasMilestones && (
        <div
          className={cn(
            "absolute bottom-1 flex gap-0.5 items-center justify-center",
          )}
        >
          {taskMilestones.slice(0, 3).map((m, i) => (
            <div
              key={i}
              className={cn(
                "h-[5px] w-[5px] rounded-full",
                isSelected
                  ? "bg-[#3a1205]/60"
                  : allDone
                  ? "bg-orange-400/70"
                  : "",
              )}
              style={!isSelected && !allDone ? { background: "var(--text-faint)" } : undefined}
            />
          ))}
          {taskMilestones.length > 3 && (
            <span
              className={cn(
                "text-[7px] font-bold ml-0.5",
                isSelected ? "text-[#3a1205]/70" : "",
              )}
              style={!isSelected ? { color: "var(--text-faint)" } : undefined}
            >
              +
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

/* ─── Droppable mobile day row ─── */
export function DroppableMobileDay({
  day,
  isTodayDay,
  milestones,
  onUnassign,
}: {
  day: Date;
  isTodayDay: boolean;
  milestones: AssignableMilestone[];
  onUnassign?: (id: string) => void;
  key?: React.Key;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: format(day, "yyyy-MM-dd"),
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex items-start group transition-all py-1.5",
        isOver && "bg-orange-500/[0.08]"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] transition-all",
          isOver ? "bg-orange-400" : isTodayDay ? "bg-orange-500" : "bg-transparent",
        )}
      />
      <div className="pointer-events-none absolute left-4 right-4 top-0 h-px" style={{ background: "var(--divider)" }} />
      
      <div className="w-16 shrink-0 py-4 pl-4 pr-3 flex flex-col items-start">
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5 transition-colors",
            isTodayDay ? "text-orange-500" : "",
          )}
          style={!isTodayDay ? { color: "var(--text-secondary)" } : undefined}
        >
          {format(day, "EEE")}
        </span>
        <span className="text-lg font-semibold transition-colors" style={{ color: isTodayDay ? "var(--text-primary)" : "var(--text-secondary)" }}>
          {format(day, "d")}
        </span>
      </div>

      <div className="flex-1 min-w-0 py-4 px-3 sm:px-4 min-h-[4rem]">
        <div className="space-y-1">
          {milestones.length === 0 && !isOver && (
            <div className="py-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
              —
            </div>
          )}
          {isOver && milestones.length === 0 && (
            <div className="flex items-center gap-2 py-1 text-orange-400/80 font-bold text-[10px] tracking-wider uppercase">
              <span className="text-base leading-none mb-0.5">+</span> ADD TASK
            </div>
          )}
          {milestones.map((ms) => (
            <div
              key={ms.id}
              onClick={() => onUnassign && onUnassign(ms.id)}
              className="px-2.5 py-2 rounded-lg bg-[linear-gradient(145deg,rgba(249,115,22,0.15),rgba(249,115,22,0.05))] border border-orange-400/20 truncate flex items-center justify-between cursor-pointer hover:bg-[linear-gradient(145deg,rgba(249,115,22,0.25),rgba(249,115,22,0.1))] transition-colors"
            >
              <span className="text-[12px] text-orange-200 font-medium truncate pr-2">
                {ms.title}
              </span>
              <span className="text-[10px] transition-colors" style={{ color: "var(--text-faint)" }}>✕</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
