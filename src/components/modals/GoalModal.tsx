import React from "react";
import { format, isValid, parseISO } from "date-fns";
import { motion } from "motion/react";
import { CalendarDays, Flag, Plus, Repeat2, Tag } from "lucide-react";
import {
  NativeDateField,
  NativeOptionField,
  type NativePickerOption,
} from "../ui/AppNativePickers";
import { cn } from "../../lib/utils";
import type { GoalFormState } from "../../hooks/useGoals";
import type { Category, Goal } from "../../storage";

interface GoalModalProps {
  isAddingGoal: boolean;
  editingGoal: Goal | null;
  onClose: () => void;
  handleAddGoal: (e: React.FormEvent) => Promise<void>;
  newGoal: GoalFormState;
  setNewGoal: React.Dispatch<React.SetStateAction<GoalFormState>>;
  categories: Category[];
  isSaving: boolean;
  saveError?: string | null;
}

const MODAL_PANEL_CLASS =
  "relative w-full max-w-[480px] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[16px] oryn-surface-modal";

const LABEL_CLASS =
  "mb-1 block text-[9px] font-semibold uppercase tracking-[0.16em]";

const FIELD_CLASS =
  "h-9 w-full rounded-[9px] px-2.5 text-[13px] font-medium outline-none transition-colors oryn-input";

const PAIRED_GRID_CLASS = "grid grid-cols-2 gap-2 max-[480px]:grid-cols-1";

const CANCEL_BUTTON_CLASS =
  "flex-1 h-10 rounded-[9px] text-[12px] font-semibold transition-colors";

const PRIMARY_BUTTON_CLASS =
  "flex-1 h-10 rounded-[9px] bg-[linear-gradient(180deg,#ff8a1f,#f97316)] text-[12px] font-bold text-[#231006] shadow-[0_12px_28px_-22px_rgba(249,115,22,0.95)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55";

const PRIORITY_OPTIONS: NativePickerOption[] = [
  {
    value: "High",
    label: "High",
    leading: <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />,
  },
  {
    value: "Medium",
    label: "Medium",
    leading: <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />,
  },
  {
    value: "Low",
    label: "Low",
    leading: <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />,
  },
];

const REPEAT_OPTIONS: NativePickerOption[] = [
  { value: "None", label: "No Repeat" },
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

const GOAL_COLOR_OPTIONS = [
  { value: "#f97316", label: "Orange" },
  { value: "#10b981", label: "Emerald" },
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#0ea5e9", label: "Sky" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#bef264", label: "Lime" },
] as const;

function formatDateLabel(dateValue?: string) {
  if (!dateValue) return "";
  const parsed = parseISO(dateValue);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : "";
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isAddingGoal,
  editingGoal,
  onClose,
  handleAddGoal,
  newGoal,
  setNewGoal,
  categories,
  isSaving,
  saveError,
}) => {
  const [activePicker, setActivePicker] = React.useState<
    null | "category" | "priority" | "deadline" | "repeat"
  >(null);

  React.useEffect(() => {
    if (!isAddingGoal && !editingGoal) {
      setActivePicker(null);
    }
  }, [editingGoal, isAddingGoal]);

  if (!isAddingGoal && !editingGoal) return null;

  const closeModal = () => {
    setActivePicker(null);
    onClose();
  };

  const selectedCategory =
    categories.find((category) => category.name === newGoal.category) || null;

  const categoryOptions: NativePickerOption[] = categories.map((category) => ({
    value: category.name,
    label: category.name,
    leading: (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-[8px] border text-[13px]"
        style={{ backgroundColor: `${category.color}20`, color: category.color, borderColor: "var(--surface-border)" }}
      >
        {category.icon || "*"}
      </span>
    ),
  }));

  const priorityTone = {
    High: "bg-rose-400",
    Medium: "bg-amber-300",
    Low: "bg-emerald-300",
  }[newGoal.priority || "Medium"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        className="absolute inset-0 bg-black/78 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={MODAL_PANEL_CLASS}
      >
        <div className="p-4 md:p-5">
          <h3 className="mb-3 text-[22px] md:text-[24px] font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {editingGoal ? "Edit Goal" : "New Goal"}
          </h3>
          <form onSubmit={handleAddGoal} className="space-y-2.5">
            <div>
              <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Goal Title</label>
              <input
                autoFocus
                required
                type="text"
                placeholder="What do you want to achieve?"
                className={FIELD_CLASS}
                value={newGoal.title || ""}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              />
            </div>

            <div className={PAIRED_GRID_CLASS}>
              <div className="min-w-0">
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Category</label>
                <NativeOptionField
                  open={activePicker === "category"}
                  onOpenChange={(open) => setActivePicker(open ? "category" : null)}
                  selectedValue={newGoal.category}
                  displayValue={selectedCategory?.name || newGoal.category}
                  placeholder="Choose category"
                  leading={
                    selectedCategory ? (
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-[8px] border text-[13px]"
                        style={{
                          backgroundColor: `${selectedCategory.color}20`,
                          color: selectedCategory.color,
                          borderColor: "var(--surface-border)",
                        }}
                      >
                        {selectedCategory.icon || "*"}
                      </span>
                    ) : (
                      <Tag className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                    )
                  }
                  options={categoryOptions}
                  emptyState="Add a category first"
                  onSelect={(value) => setNewGoal({ ...newGoal, category: value })}
                />
              </div>

              <div className="min-w-0">
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Priority</label>
                <NativeOptionField
                  open={activePicker === "priority"}
                  onOpenChange={(open) => setActivePicker(open ? "priority" : null)}
                  selectedValue={newGoal.priority}
                  displayValue={newGoal.priority || "Medium"}
                  placeholder="Choose priority"
                  leading={<span className={`h-2.5 w-2.5 rounded-full ${priorityTone}`} />}
                  options={PRIORITY_OPTIONS}
                  onSelect={(value) =>
                    setNewGoal({ ...newGoal, priority: value as GoalFormState["priority"] })
                  }
                />
              </div>
            </div>

            {editingGoal ? (
              <div className={PAIRED_GRID_CLASS}>
                <div className="min-w-0">
                  <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Deadline</label>
                  <NativeDateField
                    open={activePicker === "deadline"}
                    onOpenChange={(open) => setActivePicker(open ? "deadline" : null)}
                    value={newGoal.deadline}
                    displayValue={formatDateLabel(newGoal.deadline)}
                    placeholder="Choose a date"
                    panelWidth="row"
                    leading={<CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                    onSelect={(value) => setNewGoal({ ...newGoal, deadline: value })}
                    onClear={() => setNewGoal({ ...newGoal, deadline: "" })}
                  />
                </div>

                <div className="min-w-0">
                  <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Repeat</label>
                  <NativeOptionField
                    open={activePicker === "repeat"}
                    onOpenChange={(open) => setActivePicker(open ? "repeat" : null)}
                    selectedValue={newGoal.repeat}
                    displayValue={newGoal.repeat === "None" ? "No Repeat" : newGoal.repeat}
                    placeholder="Choose repeat"
                    leading={<Repeat2 className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                    options={REPEAT_OPTIONS}
                    onSelect={(value) =>
                      setNewGoal({ ...newGoal, repeat: value as GoalFormState["repeat"] })
                    }
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Deadline</label>
                <NativeDateField
                  open={activePicker === "deadline"}
                  onOpenChange={(open) => setActivePicker(open ? "deadline" : null)}
                  value={newGoal.deadline}
                  displayValue={formatDateLabel(newGoal.deadline)}
                  placeholder="Choose a date"
                  panelWidth="row"
                  leading={<CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                  onSelect={(value) => setNewGoal({ ...newGoal, deadline: value })}
                  onClear={() => setNewGoal({ ...newGoal, deadline: "" })}
                />
              </div>
            )}

            <div>
              <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Accent Color</label>
              <div className="flex min-h-9 flex-wrap items-center gap-1.5">
                {GOAL_COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    title={colorOption.label}
                    onClick={() => setNewGoal({ ...newGoal, color: colorOption.value })}
                    className={cn(
                      "h-6 w-6 rounded-full border transition-all duration-200",
                      newGoal.color === colorOption.value
                        ? "ring-1 ring-orange-400/55"
                        : "opacity-75 hover:opacity-100",
                    )}
                    style={{
                      backgroundColor: colorOption.value,
                      borderColor:
                        newGoal.color === colorOption.value
                          ? "var(--text-primary)"
                          : "var(--surface-border)",
                      boxShadow:
                        newGoal.color === colorOption.value
                          ? `0 0 12px ${colorOption.value}50`
                          : undefined,
                    }}
                  />
                ))}
                {/* Custom color picker */}
                {(() => {
                  const isCustomGoalColor = !GOAL_COLOR_OPTIONS.some((o) => o.value === newGoal.color);
                  return (
                    <div className="relative">
                      <button
                        type="button"
                        title="Pick custom color"
                        onClick={() => {
                          const input = document.getElementById("goal-custom-color-input") as HTMLInputElement;
                          input?.click();
                        }}
                        className={cn(
                          "h-6 w-6 rounded-full transition-all duration-200 flex items-center justify-center",
                          isCustomGoalColor
                            ? "ring-1 ring-orange-400/55"
                            : "hover:opacity-100",
                        )}
                        style={{
                          background: isCustomGoalColor
                            ? newGoal.color
                            : "var(--input-bg)",
                          border: isCustomGoalColor
                            ? "2px solid var(--text-primary)"
                            : "2px solid var(--surface-border-strong)",
                          boxShadow: isCustomGoalColor
                            ? `0 0 12px ${newGoal.color}50`
                            : undefined,
                        }}
                      >
                        {!isCustomGoalColor && (
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: "var(--text-secondary)" }} />
                        )}
                      </button>
                      <input
                        id="goal-custom-color-input"
                        type="color"
                        className="absolute inset-0 h-0 w-0 overflow-hidden opacity-0"
                        value={newGoal.color || "#f97316"}
                        onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Note (Optional)</label>
              <textarea
                placeholder="Add some context or motivation..."
                className={`${FIELD_CLASS} h-14 resize-none py-2`}
                value={newGoal.note || ""}
                onChange={(e) => setNewGoal({ ...newGoal, note: e.target.value })}
              />
            </div>

            {saveError && (
              <div className="rounded-[9px] border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[12px] font-medium text-rose-300">
                {saveError}
              </div>
            )}

            <div className="flex gap-2 pt-1.5">
              <button type="button" onClick={closeModal} className={CANCEL_BUTTON_CLASS} style={{ border: "1px solid var(--surface-border-strong)", background: "var(--input-bg)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={PRIMARY_BUTTON_CLASS}
              >
                {isSaving ? "Saving..." : editingGoal ? "Save Changes" : "Create Goal"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
