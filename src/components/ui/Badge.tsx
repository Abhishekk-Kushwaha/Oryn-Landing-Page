import React from "react";
import { cn } from "../../lib/utils";

export const Badge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-widest uppercase uppercase tracking-wider border",
      className,
    )}
  >
    {children}
  </span>
);
