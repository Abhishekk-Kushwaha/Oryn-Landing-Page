import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  defaultDropAnimationSideEffects,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  GripVertical,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isCompletedOnDate, isDueOnDate, type Category, type Goal, type Milestone } from "../storage";
import { DraggableMilestone } from "../components/dnd/DraggableMilestone";
import { TaskPreviewCard } from "../components/TaskPreviewCard";
import type { ViewType } from "../hooks/useAppRouter";

type PlannerRepeat = "None" | "Daily" | "Weekly" | "Monthly";

type PlannerMilestone = Milestone & {
  goalTitle: string;
  goal?: Goal;
};

type PlannerTask = PlannerMilestone & {
  goal: Goal;
  done: boolean;
};

type PlannerViewProps = {
  goals: Goal[];
  categories: Category[];
  handleAddPlannerTask: (
    title: string,
    date: Date,
    repeat: PlannerRepeat,
  ) => void | Promise<void>;
  deleteMilestone: (id: string) => void | Promise<void>;
  editMilestone: (
    id: string,
    updates: Partial<Milestone>,
  ) => void | Promise<void>;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function DroppablePlannerDate({
  dateStr,
  isSelected,
  isTodayDate,
  showDivider,
  selectedRef,
  onClick,
  children,
}: {
  dateStr: string;
  isSelected: boolean;
  isTodayDate: boolean;
  showDivider: boolean;
  selectedRef: React.MutableRefObject<HTMLDivElement | null>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: dateStr,
  });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (isSelected && selectedRef) {
          selectedRef.current = node;
        }
      }}
      onClick={onClick}
      className="relative flex items-start group cursor-pointer transition-all py-1.5"
      style={{
        background: isOver
          ? "var(--planner-drop-bg)"
          : isSelected
            ? "var(--planner-selected-bg)"
            : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isOver) {
          e.currentTarget.style.background = "var(--planner-hover-bg)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isOver) {
          e.currentTarget.style.background = "";
        }
      }}
    >
      {showDivider ? (
        <div
          className="pointer-events-none absolute left-4 right-4 top-0 h-px"
          style={{ background: "var(--planner-row-divider)" }}
        />
      ) : null}
      {/* Left accent bar for selected / today */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] rounded-full transition-all",
          isSelected ? "bg-orange-500" : isTodayDate ? "bg-orange-500/40" : "bg-transparent",
        )}
      />
      {children}
    </div>
  );
}

function DraggablePlannerTask({
  milestone,
  isSelected,
  onEdit,
  onDelete,
  onToggleComplete,
  onPreview,
}: {
  milestone: PlannerTask;
  isSelected: boolean;
  onEdit: (milestone: PlannerTask) => void;
  onDelete: (id: string) => void | Promise<void>;
  onToggleComplete: (milestone: PlannerTask) => void;
  onPreview: (milestone: PlannerMilestone) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: milestone.id,
    data: {
      type: "milestone",
      milestone,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/task flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-all w-full",
        milestone.done && "opacity-40",
      )}
      style={{ opacity: isDragging ? 0.5 : 1, background: "var(--stat-cell-bg)", borderColor: "var(--divider)" }}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing opacity-100 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity"
        style={{ color: "var(--text-faint)" }}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPreview(milestone);
        }}
        className="flex-1 min-w-0 text-left"
        aria-label={`Preview ${milestone.title}`}
      >
        <h4
          className={cn(
            "text-sm truncate transition-colors",
            milestone.done ? "line-through" : "font-medium tracking-tight",
          )}
          style={{ color: milestone.done ? "var(--text-muted)" : "var(--text-primary)" }}
        >
          {milestone.title}
        </h4>
      </button>

      {isSelected && (
        <div className="flex items-center opacity-100 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(milestone);
            }}
            className="p-1 rounded-md transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(milestone.id);
            }}
            className="p-1 rounded-md transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}



export function PlannerView({
  goals,
  categories,
  handleAddPlannerTask,
  deleteMilestone,
  editMilestone,
  setView,
}: PlannerViewProps) {
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");
  const [baseDate, setBaseDate] = useState(startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [addingTaskForDate, setAddingTaskForDate] = useState<string | null>(null);
  const [hasClickedAssign, setHasClickedAssign] = useState(() => {
    try {
      return localStorage.getItem("oryn_assign_tasks_clicked") === "true";
    } catch {
      return false;
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskRepeat, setNewTaskRepeat] = useState<PlannerRepeat>("None");
  const [isRepeatMenuOpen, setIsRepeatMenuOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskRepeat, setEditTaskRepeat] = useState<PlannerRepeat>("None");
  const [isEditRepeatMenuOpen, setIsEditRepeatMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewTask, setPreviewTask] = useState<PlannerMilestone | null>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const repeatOptions: PlannerRepeat[] = ["None", "Daily", "Weekly", "Monthly"];

  const activeMilestone = useMemo(() => {
    if (!activeId) return null;

    for (const g of goals) {
      const milestone = (g.milestones || []).find((m: Milestone) => m.id === activeId);
      if (milestone) {
        return { ...milestone, goalTitle: g.title };
      }
    }
    return null;
  }, [activeId, goals]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id) {
      const milestoneId = String(active.id);
      const targetId = String(over.id);
      editMilestone(milestoneId, { due_date: targetId });
    }
  };



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

  const dates = useMemo(() => {
    if (mode === "weekly") {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }

    const start = startOfMonth(baseDate);
    const end = endOfMonth(baseDate);
    return eachDayOfInterval({ start, end });
  }, [mode, baseDate]);

  const milestonesMap = useMemo(() => {
    const map: Record<string, PlannerTask[]> = {};
    const allItems: PlannerTask[] = goals.flatMap((goal: Goal) =>
      (goal.milestones || []).map((milestone) => ({
        ...milestone,
        goal,
        goalTitle: goal.title,
        done: milestone.done,
      })),
    );

    dates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      map[dateStr] = allItems
        .filter((item) => isDueOnDate(item, date))
        .map((item) => ({
          ...item,
          done: isCompletedOnDate(item, date),
        }));
    });

    return map;
  }, [goals, dates]);

  const handlePrev = () => {
    setBaseDate((prev) => (mode === "weekly" ? addDays(prev, -7) : subMonths(prev, 1)));
  };

  const handleNext = () => {
    setBaseDate((prev) => (mode === "weekly" ? addDays(prev, 7) : addMonths(prev, 1)));
  };

  const handleToday = () => {
    const today = startOfDay(new Date());
    setBaseDate(today);
    setSelectedDate(today);
  };

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [mode, baseDate]);

  const handleAddTask = (e: React.FormEvent, date: Date) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    handleAddPlannerTask(newTaskTitle, date, newTaskRepeat);
    setNewTaskTitle("");
    setNewTaskRepeat("None");
    setIsRepeatMenuOpen(false);
    setAddingTaskForDate(null);
  };

  return (
    <motion.div
      key="planner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="md:p-8 max-w-7xl mx-auto w-full min-h-screen"
      style={{ background: "var(--app-bg)" }}
    >
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-row md:gap-6 min-h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full relative">


          {/* Main Timeline Area */}
          <div className="flex-1 flex flex-col min-w-0 md:rounded-2xl" style={{ background: "var(--app-bg)", border: "1px solid var(--surface-border)" }}>
            {/* Sticky Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 sm:px-6 py-4 backdrop-blur-xl sticky top-0 z-30" style={{ background: "color-mix(in srgb, var(--app-bg) 95%, transparent)", borderBottom: "1px solid var(--divider)" }}>
              <div className="flex min-w-0 items-center gap-2 sm:gap-2.5 md:flex-nowrap md:gap-3">
                <div className="flex items-center p-0.5 rounded-lg" style={{ background: "var(--stat-cell-bg)", border: "1px solid var(--surface-border)" }}>
                  <button
                    onClick={() => {
                      setMode("weekly");
                      setBaseDate(startOfDay(new Date()));
                      setSelectedDate(startOfDay(new Date()));
                    }}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] transition-all md:px-3 md:text-[10px] md:tracking-wider",
                    )}
                    style={mode === "weekly" ? { background: "var(--app-bg)", color: "var(--text-primary)" } : { color: "var(--text-muted)" }}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => {
                      setMode("monthly");
                      setBaseDate(startOfDay(new Date()));
                      setSelectedDate(startOfDay(new Date()));
                    }}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] transition-all md:px-3 md:text-[10px] md:tracking-wider",
                    )}
                    style={mode === "monthly" ? { background: "var(--app-bg)", color: "var(--text-primary)" } : { color: "var(--text-muted)" }}
                  >
                    Month
                  </button>
                </div>

                <button
                  onClick={() => {
                    try {
                      localStorage.setItem("oryn_assign_tasks_clicked", "true");
                    } catch (e) {
                      console.warn(e);
                    }
                    setHasClickedAssign(true);
                    setView("assign-tasks");
                  }}
                  className={cn(
                    "ml-auto flex shrink-0 items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/20 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all hover:bg-orange-500/30 hover:border-orange-500/40 md:ml-2 md:gap-1.5 md:px-3 md:text-[10px] md:tracking-wider md:whitespace-nowrap",
                    !hasClickedAssign && "animate-assign-tasks-pulse"
                  )}
                >
                  <Plus className="h-3 w-3" />
                  Assign Tasks
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  className="p-1.5 transition-colors rounded-lg"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-xs font-bold uppercase tracking-widest min-w-[130px] text-center" style={{ color: "var(--text-primary)" }}>
                  {mode === "weekly"
                    ? `Week of ${format(startOfWeek(baseDate, { weekStartsOn: 1 }), "MMM d")}`
                    : format(baseDate, "MMMM yyyy")}
                </h3>
                <button
                  onClick={handleNext}
                  className="p-1.5 transition-colors rounded-lg"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Timeline Day Rows */}
            <div className="flex-1 px-4 sm:px-6 pb-24 md:pb-8 pt-2">
              <div>
                {dates.map((date, index) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const isSelected = isSameDay(date, selectedDate);
                  const isTodayDate = isSameDay(date, new Date());
                  const dayTasks = milestonesMap[dateStr] || [];

                  return (
                    <DroppablePlannerDate
                      key={dateStr}
                      dateStr={dateStr}
                      isSelected={isSelected}
                      isTodayDate={isTodayDate}
                      showDivider={index > 0}
                      selectedRef={selectedRef}
                      onClick={() => {
                        if (!isSelected) {
                          setSelectedDate(date);
                          setAddingTaskForDate(null);
                        }
                      }}
                    >
                      {/* Date Column */}
                      <div
                        className={cn(
                          "w-16 sm:w-20 shrink-0 py-4 pl-5 pr-3 flex flex-col items-start",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5 transition-colors",
                            isTodayDate ? "text-orange-500" : "",
                          )}
                          style={isTodayDate ? undefined : { color: "var(--planner-day-text-muted)" }}
                        >
                          {format(date, "EEE")}
                        </span>
                        <span
                          className={cn(
                            "text-lg font-semibold transition-colors",
                            isTodayDate && !isSelected ? "text-orange-400" : "",
                          )}
                          style={
                            isSelected
                              ? { color: "var(--text-primary)" }
                              : isTodayDate
                                ? undefined
                                : { color: "var(--text-secondary)" }
                          }
                        >
                          {format(date, "d")}
                        </span>
                      </div>

                      {/* Task Column */}
                      <div className={cn(
                        "flex-1 min-w-0 py-4 px-3 sm:px-4",
                        dayTasks.length === 0 && !isSelected ? "min-h-[3rem]" : "min-h-[4rem]",
                      )}>
                        <div className="space-y-0.5">
                          {false && dayTasks.length === 0 && !isSelected && (
                            <div className="py-1 text-[10px] italic" style={{ color: "var(--text-faint)" }}>
                              —
                            </div>
                          )}

                          {dayTasks.map((milestone) => {
                            if (editingTaskId === milestone.id) {
                              return (
                                <form
                                  key={milestone.id}
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    if (editTaskTitle.trim()) {
                                      editMilestone(milestone.id, {
                                        title: editTaskTitle.trim(),
                                        repeat: editTaskRepeat,
                                      });
                                      setEditingTaskId(null);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 mb-2 flex items-center gap-2 p-1.5 pl-3 rounded-lg border"
                                  style={{ background: "var(--input-bg)", borderColor: "var(--input-border)" }}
                                >
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editTaskTitle}
                                    onChange={(e) => setEditTaskTitle(e.target.value)}
                                    placeholder="Edit task..."
                                    className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                                    style={{ color: "var(--input-text)" }}
                                  />

                                  <div className="relative shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setIsEditRepeatMenuOpen(!isEditRepeatMenuOpen)}
                                      className="px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                      style={
                                        editTaskRepeat !== "None"
                                          ? { background: "var(--planner-selected-bg)", color: "var(--text-primary)" }
                                          : { color: "var(--text-muted)" }
                                      }
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      {editTaskRepeat === "None" ? "Repeat" : editTaskRepeat}
                                    </button>

                                    <AnimatePresence>
                                      {isEditRepeatMenuOpen && (
                                        <motion.div
                                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                          className="absolute right-0 bottom-full mb-2 w-36 rounded-lg shadow-xl overflow-hidden z-50"
                                          style={{ background: "var(--surface-modal)", border: "1px solid var(--surface-border-strong)" }}
                                        >
                                          {repeatOptions.map((opt) => (
                                            <button
                                              key={opt}
                                              type="button"
                                              onClick={() => {
                                                setEditTaskRepeat(opt);
                                                setIsEditRepeatMenuOpen(false);
                                              }}
                                              className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                                              style={
                                                editTaskRepeat === opt
                                                  ? { color: "var(--text-primary)", background: "var(--planner-hover-bg)" }
                                                  : { color: "var(--text-secondary)" }
                                              }
                                            >
                                              {opt === "None" ? "No repeat" : `Repeat ${opt}`}
                                            </button>
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={!editTaskTitle.trim()}
                                    className="p-1.5 bg-orange-500 text-white rounded-md disabled:opacity-50 transition-opacity"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTaskId(null)}
                                    className="p-1.5 transition-colors"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              );
                            }

                            return (
                              <DraggablePlannerTask
                                key={milestone.id}
                                milestone={milestone}
                                isSelected={isSelected}
                                onEdit={(m) => {
                                  setEditingTaskId(m.id);
                                  setEditTaskTitle(m.title);
                                  setEditTaskRepeat(m.repeat || "None");
                                }}
                                onDelete={deleteMilestone}
                                onToggleComplete={(m) => {
                                  editMilestone(m.id, { done: !m.done });
                                }}
                                onPreview={setPreviewTask}
                              />
                            );
                          })}

                          {isSelected &&
                            (addingTaskForDate === dateStr ? (
                              <form
                                onSubmit={(e) => handleAddTask(e, date)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 flex items-center gap-2 p-1.5 pl-3 rounded-lg border"
                                style={{ background: "var(--input-bg)", borderColor: "var(--input-border)" }}
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  value={newTaskTitle}
                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                  placeholder="Type a task..."
                                  className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                                  style={{ color: "var(--input-text)" }}
                                />

                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setIsRepeatMenuOpen(!isRepeatMenuOpen)}
                                    className="px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                    style={
                                      newTaskRepeat !== "None"
                                        ? { background: "var(--planner-selected-bg)", color: "var(--text-primary)" }
                                        : { color: "var(--text-muted)" }
                                    }
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    {newTaskRepeat === "None" ? "Repeat" : newTaskRepeat}
                                  </button>

                                  <AnimatePresence>
                                    {isRepeatMenuOpen && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        className="absolute right-0 bottom-full mb-2 w-36 rounded-lg shadow-xl overflow-hidden z-50"
                                        style={{ background: "var(--surface-modal)", border: "1px solid var(--surface-border-strong)" }}
                                      >
                                        {repeatOptions.map((opt) => (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => {
                                              setNewTaskRepeat(opt);
                                              setIsRepeatMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                                            style={
                                              newTaskRepeat === opt
                                                ? { color: "var(--text-primary)", background: "var(--planner-hover-bg)" }
                                                : { color: "var(--text-secondary)" }
                                            }
                                          >
                                            {opt === "None" ? "No repeat" : `Repeat ${opt}`}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                <button
                                  type="submit"
                                  disabled={!newTaskTitle.trim()}
                                  className="p-1.5 bg-orange-500 text-white rounded-md disabled:opacity-50 transition-opacity"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddingTaskForDate(dateStr);
                                  setNewTaskTitle("");
                                  setNewTaskRepeat("None");
                                }}
                                className="mt-2 text-left text-[10px] font-semibold uppercase tracking-wider py-1.5 px-2 -mx-2 rounded-md transition-colors flex items-center gap-2 w-max"
                                style={{ color: "var(--text-muted)" }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Task
                              </button>
                            ))}
                        </div>
                      </div>
                    </DroppablePlannerDate>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

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
            <div className="pointer-events-none rounded-xl border border-orange-500/50 bg-orange-500/10 p-2 shadow-xl shadow-orange-500/20 backdrop-blur-xl md:p-3">
              <p className="text-[10px] font-semibold tracking-widest uppercase truncate" style={{ color: "var(--text-primary)" }}>
                {activeMilestone.title}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskPreviewCard
        open={Boolean(previewTask)}
        onClose={() => setPreviewTask(null)}
        title={previewTask?.title || ""}
        accentColor={
          categories.find((category: Category) => category.name === previewTask?.goal?.category)?.color ||
          "#f97316"
        }
        metadata={[
          {
            label: "Date",
            value: previewTask?.due_date ? format(new Date(previewTask.due_date), "MMM d, yyyy") : undefined,
            icon: "calendar",
          },
          {
            label: "Repeat",
            value: previewTask?.repeat && previewTask.repeat !== "None" ? previewTask.repeat : undefined,
            icon: "repeat",
          },
          {
            label: "Status",
            value: previewTask ? (previewTask.done ? "Completed" : "Open") : undefined,
            icon: "status",
          },
        ]}
      />
    </motion.div>
  );
}
