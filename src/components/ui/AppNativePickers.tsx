import React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const FIELD_TRIGGER_CLASS =
  "flex h-9 w-full items-center justify-between gap-3 rounded-[9px] px-2.5 text-left text-[13px] font-medium outline-none transition-colors oryn-input";

const OPTION_PANEL_CLASS =
  "absolute left-0 top-[calc(100%+0.45rem)] z-30 w-full rounded-[14px] p-1.5 backdrop-blur-xl oryn-surface-modal";

const DATE_PANEL_CLASS =
  "absolute left-0 top-[calc(100%+0.45rem)] z-30 rounded-[14px] p-2.5 backdrop-blur-xl max-[480px]:static max-[480px]:mt-2 oryn-surface-modal";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export type NativePickerOption = {
  value: string;
  label: string;
  leading?: React.ReactNode;
};

type NativeFieldButtonProps = {
  value?: string;
  placeholder: string;
  leading?: React.ReactNode;
  onClick: () => void;
  className?: string;
};

type NativeOptionFieldProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedValue?: string;
  displayValue?: string;
  placeholder: string;
  leading?: React.ReactNode;
  options: NativePickerOption[];
  onSelect: (value: string) => void;
  emptyState?: string;
  triggerClassName?: string;
};

type NativeDateFieldProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  displayValue?: string;
  placeholder: string;
  leading?: React.ReactNode;
  onSelect: (value: string) => void;
  onClear?: () => void;
  panelWidth?: "field" | "row";
  triggerClassName?: string;
};

function parseDateValue(value?: string | null) {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

function usePopoverDismiss(
  open: boolean,
  onClose: () => void,
  refs: Array<React.RefObject<HTMLElement | null>>,
) {
  React.useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedInside = refs.some((ref) => ref.current?.contains(target));
      if (!clickedInside) onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, refs]);
}

export function NativeFieldButton({
  value,
  placeholder,
  leading,
  onClick,
  className,
}: NativeFieldButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(FIELD_TRIGGER_CLASS, className)}
    >
      <span className="flex min-w-0 items-center gap-2">
        {leading ? <span className="shrink-0">{leading}</span> : null}
        <span className="truncate" style={{ color: value ? "var(--text-primary)" : "var(--input-placeholder)" }}>
          {value || placeholder}
        </span>
      </span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
    </button>
  );
}

export function NativeOptionField({
  open,
  onOpenChange,
  selectedValue,
  displayValue,
  placeholder,
  leading,
  options,
  onSelect,
  emptyState = "No options",
  triggerClassName,
}: NativeOptionFieldProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  usePopoverDismiss(open, () => onOpenChange(false), [wrapperRef]);

  return (
    <div ref={wrapperRef} className="relative">
      <NativeFieldButton
        value={displayValue}
        placeholder={placeholder}
        leading={leading}
        onClick={() => onOpenChange(!open)}
        className={triggerClassName}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={OPTION_PANEL_CLASS}
          >
            {options.length === 0 ? (
              <div className="rounded-[10px] px-3 py-2.5 text-[12px] font-medium" style={{ color: "var(--text-faint)" }}>
                {emptyState}
              </div>
            ) : (
              <div className="space-y-1">
                {options.map((option) => {
                  const active = option.value === selectedValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onSelect(option.value);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-[10px] px-2.5 text-left transition-colors",
                        active
                          ? "bg-orange-500/12 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.34)]"
                          : "",
                      )}
                      style={{ color: active ? "var(--text-primary)" : "var(--picker-option-inactive-text)" }}
                    >
                      {option.leading ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] text-[13px]">
                          {option.leading}
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                        {option.label}
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
                          active ? "text-orange-500" : "text-transparent",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NativeDateField({
  open,
  onOpenChange,
  value,
  displayValue,
  placeholder,
  leading,
  onSelect,
  onClear,
  panelWidth = "field",
  triggerClassName,
}: NativeDateFieldProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const selectedDate = React.useMemo(() => parseDateValue(value), [value]);
  const [viewDate, setViewDate] = React.useState<Date>(() => selectedDate || startOfDay(new Date()));
  const today = React.useMemo(() => startOfDay(new Date()), []);

  React.useEffect(() => {
    if (open) {
      setViewDate(selectedDate || startOfDay(new Date()));
    }
  }, [open, selectedDate]);

  usePopoverDismiss(open, () => onOpenChange(false), [wrapperRef]);

  const monthDays = React.useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 }),
      }),
    [viewDate],
  );

  return (
    <div ref={wrapperRef} className="relative">
      <NativeFieldButton
        value={displayValue}
        placeholder={placeholder}
        leading={leading}
        onClick={() => onOpenChange(!open)}
        className={triggerClassName}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              DATE_PANEL_CLASS,
              panelWidth === "row"
                ? "w-[18.75rem] max-w-[calc(100vw-4rem)] max-[480px]:w-full"
                : "w-[17.25rem] max-w-[calc(100vw-4rem)] max-[480px]:w-full",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setViewDate((prev) => subMonths(prev, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--picker-nav-btn-color)", background: "var(--picker-nav-btn-bg)", border: "1px solid var(--picker-nav-btn-border)" }}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="text-[14px] font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>
                {format(viewDate, "MMMM yyyy")}
              </div>

              <button
                type="button"
                onClick={() => setViewDate((prev) => addMonths(prev, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--picker-nav-btn-color)", background: "var(--picker-nav-btn-bg)", border: "1px solid var(--picker-nav-btn-border)" }}
                aria-label="Next month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2.5 grid grid-cols-7 gap-0.5">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="flex h-5 items-center justify-center text-[9px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--picker-muted-label)" }}
                >
                  {label}
                </div>
              ))}

              {monthDays.map((day) => {
                const inMonth = isSameMonth(day, viewDate);
                const active = selectedDate ? isSameDay(day, selectedDate) : false;
                const currentDay = isSameDay(day, today);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      onSelect(format(day, "yyyy-MM-dd"));
                      onOpenChange(false);
                    }}
                    className={cn(
                      "aspect-square rounded-[10px] text-[13px] font-semibold transition-colors",
                      active
                        ? "bg-[linear-gradient(180deg,#ff9a45,#f97316)] text-[#2b1204] shadow-[0_14px_24px_-18px_rgba(249,115,22,0.9)]"
                      : inMonth
                          ? ""
                          : "bg-transparent",
                      currentDay && !active
                        ? "border border-orange-400/24"
                        : "border border-transparent",
                    )}
                    style={
                      active
                        ? undefined
                        : {
                            background: inMonth ? "var(--picker-btn-trigger-bg)" : "transparent",
                            color: inMonth ? "var(--picker-day-current-text)" : "var(--picker-day-other-text)",
                          }
                    }
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            {selectedDate && onClear ? (
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    onOpenChange(false);
                  }}
                  className="text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-orange-300"
                  style={{ color: "var(--picker-clear-color)" }}
                >
                  Clear
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
