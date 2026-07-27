import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export const Card = ({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  key?: React.Key;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn(
      "rounded-xl overflow-hidden oryn-surface",
      className,
    )}
  >
    {children}
  </motion.div>
);
