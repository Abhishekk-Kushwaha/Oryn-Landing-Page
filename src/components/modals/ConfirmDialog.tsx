import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-4 backdrop-blur-md md:items-center"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-[30px] p-6 shadow-[0_34px_90px_-42px_rgba(0,0,0,0.3)]"
            style={{ background: "var(--surface-dialog)", border: "1px solid var(--surface-border-strong)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-400/18 bg-rose-400/10 text-rose-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-300/88">
                  Confirm Action
                </p>
                <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-full px-5 py-3 text-sm font-semibold transition-colors"
                style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-full border border-rose-400/22 bg-[linear-gradient(180deg,rgba(244,114,182,0.18),rgba(159,18,57,0.42))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-22px_rgba(190,24,93,0.9)] transition-colors hover:border-rose-300/28 hover:bg-[linear-gradient(180deg,rgba(244,114,182,0.24),rgba(159,18,57,0.5))]"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
