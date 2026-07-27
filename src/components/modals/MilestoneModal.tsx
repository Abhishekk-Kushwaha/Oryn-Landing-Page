import React from "react";
import { format, isValid, parseISO } from "date-fns";
import { motion } from "motion/react";
import { CalendarDays, Repeat2, Target } from "lucide-react";
import {
  NativeDateField,
  NativeOptionField,
  type NativePickerOption,
} from "../ui/AppNativePickers";
import type { Goal, Milestone } from "../../storage";

type MilestoneFormState = {
  title: string;
  due_date: string;
  note: string;
  goal_id: string;
  repeat: "None" | "Daily" | "Weekly" | "Monthly";
};

interface MilestoneModalProps {
  isAddingMilestone: boolean;
  editingMilestone: Milestone | null;
  closeMilestoneModal: () => void;
  handleSubmitMilestone: (e: React.FormEvent) => Promise<void>;
  newMilestone: MilestoneFormState;
  setNewMilestone: React.Dispatch<React.SetStateAction<MilestoneFormState>>;
  activeGoalId: string | null;
  goals: Goal[];
  isSaving: boolean;
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

const REPEAT_OPTIONS: NativePickerOption[] = [
  { value: "None", label: "No Repeat" },
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

function formatDateLabel(dateValue?: string) {
  if (!dateValue) return "";
  const parsed = parseISO(dateValue);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : "";
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isAddingMilestone,
  editingMilestone,
  closeMilestoneModal,
  handleSubmitMilestone,
  newMilestone,
  setNewMilestone,
  activeGoalId,
  goals,
  isSaving,
}) => {
  const [activePicker, setActivePicker] = React.useState<
    null | "goal" | "dueDate" | "repeat"
  >(null);

  const isEditing = Boolean(editingMilestone);

  React.useEffect(() => {
    if (!isAddingMilestone && !editingMilestone) {
      setActivePicker(null);
    }
  }, [editingMilestone, isAddingMilestone]);

  if (!isAddingMilestone && !editingMilestone) return null;

  const closeModal = () => {
    setActivePicker(null);
    closeMilestoneModal();
  };

  const goalOptions: NativePickerOption[] = [
    { value: "none", label: "General Task" },
    ...goals.map((goal) => ({
      value: goal.id,
      label: goal.title,
    })),
  ];

  const selectedGoalLabel =
    newMilestone.goal_id === "none"
      ? "General Task"
      : goals.find((goal) => goal.id === newMilestone.goal_id)?.title || "";

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
            {isEditing ? "Edit Milestone" : "Add Milestone"}
          </h3>
          <form onSubmit={handleSubmitMilestone} className="space-y-2.5">
            {!activeGoalId && (
              <div>
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Select Goal</label>
                <NativeOptionField
                  open={activePicker === "goal"}
                  onOpenChange={(open) => setActivePicker(open ? "goal" : null)}
                  selectedValue={newMilestone.goal_id}
                  displayValue={selectedGoalLabel}
                  placeholder="Choose a goal"
                  leading={<Target className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                  options={goalOptions}
                  onSelect={(value) => setNewMilestone({ ...newMilestone, goal_id: value })}
                />
              </div>
            )}

            <div>
              <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Milestone Title</label>
              <input
                autoFocus
                required
                type="text"
                placeholder="e.g. Complete first draft"
                className={FIELD_CLASS}
                value={newMilestone.title || ""}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              />
            </div>

            <div className={PAIRED_GRID_CLASS}>
              <div className="min-w-0">
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>
                  Due Date {newMilestone.repeat !== "None" ? "(Required for Recurring)" : "(Optional)"}
                </label>
                <NativeDateField
                  open={activePicker === "dueDate"}
                  onOpenChange={(open) => setActivePicker(open ? "dueDate" : null)}
                  value={newMilestone.due_date}
                  displayValue={formatDateLabel(newMilestone.due_date)}
                  placeholder="Choose a date"
                  panelWidth="row"
                  leading={<CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                  onSelect={(value) => setNewMilestone({ ...newMilestone, due_date: value })}
                  onClear={() => setNewMilestone({ ...newMilestone, due_date: "" })}
                />
              </div>

              <div className="min-w-0">
                <label className={LABEL_CLASS} style={{ color: "var(--text-muted)" }}>Repeat</label>
                <NativeOptionField
                  open={activePicker === "repeat"}
                  onOpenChange={(open) => setActivePicker(open ? "repeat" : null)}
                  selectedValue={newMilestone.repeat}
                  displayValue={
                    newMilestone.repeat === "None" ? "No Repeat" : newMilestone.repeat
                  }
                  placeholder="Choose repeat"
                  leading={<Repeat2 className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                  options={REPEAT_OPTIONS}
                  onSelect={(value) =>
                    setNewMilestone({
                      ...newMilestone,
                      repeat: value as MilestoneFormState["repeat"],
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1.5">
              <button type="button" onClick={closeModal} className={CANCEL_BUTTON_CLASS} style={{ border: "1px solid var(--surface-border-strong)", background: "var(--input-bg)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={PRIMARY_BUTTON_CLASS}
              >
                {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
