import React from "react";
import { AnimatePresence, motion } from "motion/react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  overlayClassName?: string;
};

export function Modal({
  open,
  onClose,
  children,
  panelClassName = "relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden oryn-surface-modal",
  overlayClassName = "absolute inset-0 bg-black/80 backdrop-blur-sm",
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={overlayClassName}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={panelClassName}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
