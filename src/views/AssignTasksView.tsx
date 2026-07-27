import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  defaultDropAnimationSideEffects,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "motion/react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  endOfWeek,
  isToday,
  isTomorrow,
} from "date-fns";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { storage, type Goal } from "../storage";
import { DraggableMilestone } from "../components/dnd/DraggableMilestone";
import { DroppableDay, DroppableMobileDay } from "../components/dnd/DroppableDay";
import type { ViewType } from "../hooks/useAppRouter";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl oryn-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

type AssignTasksViewProps = {
  goals: Goal[];
  fetchGoals: () => Promise<Goal[]>;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
};

export function AssignTasksView({
  goals,
  fetchGoals,
  setView,
}: AssignTasksViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localGoals, setLocalGoals] = useState(goals);
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchGoalsRef = useRef(fetchGoals);
  fetchGoalsRef.current = fetchGoals;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return () => {
      fetchGoalsRef.current();
    };
  }, []);

  const allUnassignedMilestones = useMemo(() => {
    return localGoals.flatMap((g: Goal) =>
      (g.milestones || [])
        .filter((m) => !m.due_date && !m.done)
        .map((m) => ({ ...m, goalTitle: g.title })),
    );
  }, [localGoals]);

  const allAssignedMilestones = useMemo(() => {
    return localGoals.flatMap((g: Goal) =>
      (g.milestones || [])
        .filter((m) => m.due_date)
        .map((m) => ({ ...m, goalTitle: g.title })),
    );
  }, [localGoals]);

  const activeMilestone = useMemo(() => {
    if (!activeId) return null;
    return (
      allUnassignedMilestones.find((m) => m.id === activeId) ||
      allAssignedMilestones.find((m) => m.id === activeId)
    );
  }, [activeId, allUnassignedMilestones, allAssignedMilestones]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id) {
      const milestoneId = active.id as string;
      const targetId = over.id as string;
      let newDate: string | null = null;

      if (targetId !== "unassigned") {
        newDate = targetId;
      }

      setLocalGoals((prev: Goal[]) =>
        prev.map((g) => ({
          ...g,
          milestones: g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, due_date: newDate } : m,
          ),
        })),
      );

      storage.updateMilestone(milestoneId, { due_date: newDate }).catch((err) => {
        console.error("Failed to update milestone:", err);
      });
    }
  };

  const { isOver: isUnassignedOver, setNodeRef: setUnassignedNodeRef } = useDroppable({
    id: "unassigned",
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  const mobileDaysList = Array.from({ length: 30 }).map((_, i) => addDays(new Date(), i));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative p-2 md:p-6 w-full max-w-[100vw] lg:max-w-[98vw] mx-auto h-[calc(100vh-60px)] md:h-[calc(100vh-40px)] flex flex-col"
        style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}
      >
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-[radial-gradient(ellipse_at_60%_0%,rgba(249,115,22,0.05),transparent_65%)]" />
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
          <div>
            <h2 className="text-[28px] font-black tracking-[-0.035em] md:text-[32px] mb-1" style={{ color: "var(--text-primary)" }}>
              Assign Tasks
            </h2>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              Drag unassigned milestones onto the calendar.
            </p>
          </div>
          <div className="flex flex-row items-center justify-between sm:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-1 rounded-[11px] p-1 flex-1 sm:flex-none justify-between sm:justify-start" style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)" }}>
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="min-w-[110px] md:min-w-[140px] text-center text-[12px] md:text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-primary)" }}>
                {format(currentMonth, "MMM yyyy")}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setView("planner")}
              className="flex items-center justify-center rounded-[10px] px-4 md:px-5 py-2 text-[12px] font-semibold transition-all shrink-0"
              style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
            >
              Done
            </button>
          </div>
        </header>

        <div className="relative flex-1 flex flex-row gap-2 md:gap-6 min-h-0">
          <div
            className={cn(
              "w-[145px] sm:w-[200px] lg:w-[300px] flex-shrink-0 flex flex-col h-full min-h-0 transition-colors rounded-lg md:rounded-xl border bg-transparent",
              isUnassignedOver && "ring-2 ring-orange-400/60",
            )}
            style={{ borderColor: "var(--surface-border)", background: isUnassignedOver ? "var(--hover-overlay)" : "transparent" }}
          >
            <div ref={setUnassignedNodeRef} className="flex flex-col h-full">
              <div className="p-3 md:p-4" style={{ borderBottom: "1px solid var(--divider)" }}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] truncate" style={{ color: "var(--text-faint)" }}>
                  <span className="hidden sm:inline">Unassigned Milestones</span>
                  <span className="sm:hidden">Unassigned</span>
                </h3>
              </div>
              <div
                className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3 custom-scrollbar"
              >
                {allUnassignedMilestones.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 mb-2" style={{ color: "var(--text-faint)" }} />
                    <p className="text-[10px] md:text-xs font-medium" style={{ color: "var(--text-faint)" }}>
                      All milestones are assigned or completed!
                    </p>
                  </div>
                ) : (
                  allUnassignedMilestones.map((ms) => (
                    <DraggableMilestone key={ms.id} milestone={ms} goalTitle={ms.goalTitle} />
                  ))
                )}
              </div>
            </div>
          </div>

          <Surface className="hidden md:flex flex-1 p-4 md:p-6 flex-col min-h-0 overflow-hidden relative">
            <div className="grid grid-cols-7 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] truncate"
                  style={{ color: "var(--text-faint)" }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-7 gap-3">
                {calendarDays.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const dayMilestones = allAssignedMilestones.filter((m) => m.due_date === dayStr);

                  return (
                    <DroppableDay
                      key={dayStr}
                      day={day}
                      isCurrentMonth={isSameMonth(day, monthStart)}
                      milestones={dayMilestones}
                      onUnassign={(milestoneId) => {
                        setLocalGoals((prev: Goal[]) =>
                          prev.map((g) => ({
                            ...g,
                            milestones: g.milestones.map((m) =>
                              m.id === milestoneId ? { ...m, due_date: null } : m,
                            ),
                          })),
                        );
                        storage.updateMilestone(milestoneId, { due_date: null }).catch((err) => {
                          console.error("Failed to unassign milestone:", err);
                        });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </Surface>

          {/* Mobile Dates List */}
          <div className="flex md:hidden flex-1 flex-col min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
            {mobileDaysList.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayMilestones = allAssignedMilestones.filter((m) => m.due_date === dayStr);
              
              return (
                <DroppableMobileDay
                  key={dayStr}
                  day={day}
                  isTodayDay={isToday(day)}
                  milestones={dayMilestones}
                  onUnassign={(milestoneId) => {
                    setLocalGoals((prev: Goal[]) =>
                      prev.map((g) => ({
                        ...g,
                        milestones: g.milestones.map((m) =>
                          m.id === milestoneId ? { ...m, due_date: null } : m,
                        ),
                      })),
                    );
                    storage.updateMilestone(milestoneId, { due_date: null }).catch((err) => {
                      console.error("Failed to unassign milestone:", err);
                    });
                  }}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}
      >
        {activeId && activeMilestone ? (
          <div className="w-[180px] md:w-[220px] rounded-[13px] px-4 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] backdrop-blur-xl pointer-events-none" style={{ border: "1px solid var(--surface-border-strong)", background: "var(--surface-modal)" }}>
            <p className="text-[12px] md:text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {activeMilestone.title}
            </p>
            <p className="mt-0.5 text-[9px] md:text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
              {activeMilestone.goalTitle}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
