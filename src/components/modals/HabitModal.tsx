import React from "react";
import { format, isValid, parseISO } from "date-fns";
import { motion } from "motion/react";
import { CalendarDays, Plus, Repeat2, Tag, Trash2 } from "lucide-react";
import {
  NativeDateField,
  NativeOptionField,
  type NativePickerOption,
} from "../ui/AppNativePickers";
import { cn } from "../../lib/utils";
import type { Category, Habit } from "../../storage";

interface HabitModalProps {
  isAddingHabit: boolean;
  setIsAddingHabit: (v: boolean) => void;
  editingHabit: Habit | null;
  setEditingHabit: (v: Habit | null) => void;
  handleAddHabit: (e: React.FormEvent) => Promise<void>;
  handleDeleteHabit: (id: string) => Promise<void>;
  newHabit: Partial<Habit>;
  setNewHabit: (v: Partial<Habit>) => void;
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

const DELETE_BUTTON_CLASS =
  "h-10 rounded-[9px] border border-rose-400/18 bg-rose-500/8 px-3 text-[12px] font-semibold text-rose-300/82 transition-colors hover:border-rose-300/28 hover:bg-rose-500/12 hover:text-rose-200";

const REPEAT_OPTIONS: NativePickerOption[] = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

function formatDateLabel(dateValue?: string) {
  if (!dateValue) return "";
  const parsed = parseISO(dateValue);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : "";
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isAddingHabit,
  setIsAddingHabit,
  editingHabit,
  setEditingHabit,
  handleAddHabit,
  handleDeleteHabit,
  newHabit,
  setNewHabit,
  categories,
  isSaving,
  saveError,
}) => {
  const [activePicker, setActivePicker] = React.useState<
    null | "category" | "repeat" | "startDate" | "endDate"
  >(null);

  const isScheduledHabit =
    newHabit.repeat === "Weekly" || newHabit.repeat === "Monthly";

  React.useEffect(() => {
    if (!isAddingHabit && !editingHabit) {
      setActivePicker(null);
    }
  }, [editingHabit, isAddingHabit]);

  React.useEffect(() => {
    if (!isScheduledHabit && activePicker === "startDate") {
      setActivePicker(null);
    }
  }, [activePicker, isScheduledHabit]);

  if (!isAddingHabit && !editingHabit) return null;

  const closeModal = () => {
    setActivePicker(null);
    setIsAddingHabit(false);
    setEditingHabit(null);
    setNewHabit({
      title: "",
      category: categories[0]?.name || "Health",
      repeat: "Daily",
      due_date: "",
      created_at: "",
    });
  };

  const selectedCategory =
    categories.find((category) => category.name === newHabit.category) || null;

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
            {editingHabit ? "Edit Habit" : "New Habit"}
          </h3>
          <form onSubmit={handleAddHabit} className="space-y-2.5">
            <div>
              <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Habit Title</label>
              <input
                autoFocus
                required
                type="text"
                placeholder="What habit do you want to build?"
                className={FIELD_CLASS}
                value={newHabit.title || ""}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
              />
            </div>

            <div className={PAIRED_GRID_CLASS}>
              <div className="min-w-0">
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Category</label>
                <NativeOptionField
                  open={activePicker === "category"}
                  onOpenChange={(open) => setActivePicker(open ? "category" : null)}
                  selectedValue={newHabit.category}
                  displayValue={selectedCategory?.name || newHabit.category}
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
                  onSelect={(value) => setNewHabit({ ...newHabit, category: value })}
                />
              </div>

              <div className="min-w-0">
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Repeat</label>
                <NativeOptionField
                  open={activePicker === "repeat"}
                  onOpenChange={(open) => setActivePicker(open ? "repeat" : null)}
                  selectedValue={newHabit.repeat}
                  displayValue={newHabit.repeat || "Daily"}
                  placeholder="Choose repeat"
                  leading={<Repeat2 className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                  options={REPEAT_OPTIONS}
                  onSelect={(value) =>
                    setNewHabit({ ...newHabit, repeat: value as Habit["repeat"] })
                  }
                />
              </div>
            </div>

            {isScheduledHabit && (
              <div>
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>
                  Start Date <span className="text-orange-400">*</span>
                </label>
                <NativeDateField
                  open={activePicker === "startDate"}
                  onOpenChange={(open) => setActivePicker(open ? "startDate" : null)}
                  value={newHabit.created_at}
                  displayValue={formatDateLabel(newHabit.created_at)}
                  placeholder="Choose a date"
                  leading={<CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                  onSelect={(value) => setNewHabit({ ...newHabit, created_at: value })}
                  onClear={() => setNewHabit({ ...newHabit, created_at: "" })}
                />
                <p className="mt-1 text-[10px] font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  This decides the {newHabit.repeat === "Weekly" ? "weekday" : "monthly date"} your
                  habit appears on and how streaks are counted.
                </p>
              </div>
            )}

            <div className={PAIRED_GRID_CLASS}>
              <div className="min-w-0">
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Target End Date</label>
                <NativeDateField
                  open={activePicker === "endDate"}
                  onOpenChange={(open) => setActivePicker(open ? "endDate" : null)}
                  value={newHabit.due_date}
                  displayValue={formatDateLabel(newHabit.due_date)}
                  placeholder="Choose a date"
                  panelWidth="row"
                  leading={<CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                  onSelect={(value) => setNewHabit({ ...newHabit, due_date: value })}
                  onClear={() => setNewHabit({ ...newHabit, due_date: "" })}
                />
              </div>

              <div className="min-w-0">
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Accent Color</label>
                <div className="flex min-h-9 flex-wrap items-center gap-1.5">
                  {[
                    { value: "#f97316", label: "Orange" },
                    { value: "#10b981", label: "Emerald" },
                    { value: "#6366f1", label: "Indigo" },
                    { value: "#8b5cf6", label: "Violet" },
                    { value: "#0ea5e9", label: "Sky" },
                    { value: "#ec4899", label: "Pink" },
                    { value: "#f59e0b", label: "Amber" },
                    { value: "#bef264", label: "Lime" },
                  ].map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      title={colorOption.label}
                      onClick={() => setNewHabit({ ...newHabit, color: colorOption.value })}
                      className={cn(
                        "h-6 w-6 rounded-full border transition-all duration-200",
                        newHabit.color === colorOption.value
                          ? "ring-1 ring-orange-400/55"
                          : "opacity-75 hover:opacity-100",
                      )}
                      style={{
                        backgroundColor: colorOption.value,
                        borderColor:
                          newHabit.color === colorOption.value
                            ? "var(--text-primary)"
                            : "var(--surface-border)",
                        boxShadow:
                          newHabit.color === colorOption.value
                            ? `0 0 12px ${colorOption.value}50`
                            : undefined,
                      }}
                    />
                  ))}
                  {/* Custom color picker */}
                  {(() => {
                    const HABIT_PRESETS = ["#f97316","#10b981","#6366f1","#8b5cf6","#0ea5e9","#ec4899","#f59e0b","#bef264"];
                    const isCustom = !HABIT_PRESETS.includes(newHabit.color || "#f97316");
                    return (
                      <div className="relative">
                        <button
                          type="button"
                          title="Pick custom color"
                          onClick={() => {
                            const input = document.getElementById("habit-custom-color-input") as HTMLInputElement;
                            input?.click();
                          }}
                          className={cn(
                            "h-6 w-6 rounded-full transition-all duration-200 flex items-center justify-center",
                            isCustom
                              ? "ring-1 ring-orange-400/55"
                              : "hover:opacity-100",
                          )}
                          style={{
                            background: isCustom
                              ? newHabit.color
                              : "var(--input-bg)",
                            border: isCustom
                              ? "2px solid var(--text-primary)"
                              : "2px solid var(--surface-border-strong)",
                            boxShadow: isCustom
                              ? `0 0 12px ${newHabit.color}50`
                              : undefined,
                          }}
                        >
                          {!isCustom && (
                            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: "var(--text-secondary)" }} />
                          )}
                        </button>
                        <input
                          id="habit-custom-color-input"
                          type="color"
                          className="absolute inset-0 h-0 w-0 overflow-hidden opacity-0"
                          value={newHabit.color || "#f97316"}
                          onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {saveError && (
              <div className="rounded-[9px] border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[12px] font-medium text-rose-300">
                {saveError}
              </div>
            )}

            <div className="flex gap-2 pt-1.5">
              {editingHabit && (
                <button
                  type="button"
                  onClick={() => void handleDeleteHabit(editingHabit.id)}
                  className={DELETE_BUTTON_CLASS}
                  aria-label="Delete habit"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </span>
                </button>
              )}
              <button type="button" onClick={closeModal} className={CANCEL_BUTTON_CLASS} style={{ border: "1px solid var(--surface-border-strong)", background: "var(--input-bg)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={PRIMARY_BUTTON_CLASS}
              >
                {isSaving ? "Saving..." : editingHabit ? "Save Changes" : "Create Habit"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
