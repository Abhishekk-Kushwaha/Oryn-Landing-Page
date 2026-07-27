import React from "react";
import { CalendarDays, CheckCircle2, Edit2, Repeat2, Tag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TaskPreviewMeta = {
  label: string;
  value?: string | null;
  icon?: "calendar" | "repeat" | "status" | "tag";
};

type TaskPreviewCardProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  accentColor?: string;
  metadata?: TaskPreviewMeta[];
  onEdit?: () => void;
  onDelete?: () => void;
};

const iconMap = {
  calendar: CalendarDays,
  repeat: Repeat2,
  status: CheckCircle2,
  tag: Tag,
};

export function TaskPreviewCard({
  open,
  onClose,
  title,
  subtitle,
  accentColor = "#34d399",
  metadata = [],
  onEdit,
  onDelete,
}: TaskPreviewCardProps) {
  const visibleMetadata = metadata.filter((item) => item.value);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-5 pt-20 sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close task preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/72 backdrop-blur-[10px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Task preview"
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[460px] overflow-hidden rounded-[18px] p-4 shadow-[0_28px_90px_-32px_rgba(0,0,0,0.3)] sm:p-5"
            style={{ background: "var(--surface-modal)", border: "1px solid var(--surface-border-strong)", color: "var(--text-primary)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}99, transparent)`,
              }}
            />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl"
              style={{ backgroundColor: `${accentColor}18` }}
            />

            <div className="relative flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 shrink-0 rounded-[4px] shadow-[0_0_22px_currentColor]"
                style={{ color: accentColor, backgroundColor: accentColor }}
              />
              <div className="min-w-0 flex-1">
                {subtitle && (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                    {subtitle}
                  </p>
                )}
                <h2 className="max-h-[42vh] overflow-y-auto pr-1 text-[18px] font-semibold leading-[1.35] tracking-[-0.01em] custom-scrollbar" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-muted)" }}
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {visibleMetadata.length > 0 && (
              <div className="relative mt-5 grid gap-2">
                {visibleMetadata.map((item) => {
                  const Icon = item.icon ? iconMap[item.icon] : Tag;

                  return (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)" }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-right text-[12px] font-medium",
                          "overflow-hidden text-ellipsis whitespace-nowrap",
                        )}
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {(onEdit || onDelete) && (
              <div className="relative mt-6 flex items-center gap-2 border-t pt-5" style={{ borderColor: "var(--divider)" }}>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onEdit();
                      onClose();
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: "var(--brand-primary, #f97316)", color: "white" }}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Milestone
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this milestone?")) {
                        onDelete();
                        onClose();
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-rose-500/10 hover:text-rose-400 active:scale-[0.95]"
                    style={{ border: "1px solid var(--surface-border)", background: "var(--hover-overlay)", color: "var(--text-muted)" }}
                    aria-label="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
