import React, { useState } from "react";
import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Milestone } from "../../storage";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function DraggableMilestone({
  milestone,
  goalTitle,
}: {
  milestone: Milestone;
  goalTitle: string;
  key?: React.Key;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
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
      onClick={(e) => {
        // dnd-kit pointer sensors usually prevent default onClick if dragged, 
        // but if it's a clean click, it will fire.
        if (!isDragging) {
          setIsExpanded(!isExpanded);
        }
      }}
      className={cn(
        "group p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all touch-none border oryn-surface",
        isDragging && "border-orange-400/30 bg-[linear-gradient(145deg,rgba(249,115,22,0.1),rgba(249,115,22,0.02))] z-50 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex items-center justify-center transition-colors" style={{ color: "var(--text-faint)" }}>
          <GripVertical className="w-4 h-4 shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-[12px] font-semibold leading-snug transition-all", !isExpanded && "truncate")} style={{ color: "var(--text-primary)" }}>
            {milestone.title}
          </p>
          <p className={cn("text-[10px] font-medium mt-0.5 transition-all", !isExpanded && "truncate")} style={{ color: "var(--text-muted)" }}>
            {goalTitle}
          </p>
        </div>
      </div>
    </div>
  );
}
