import React from 'react';
import { cn } from '../lib/utils';
import { APP_NAME } from '../lib/brand';

export const Logo = ({ className, size = "md" }: { className?: string, size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20"
  };

  return (
    <div className={cn("relative flex items-center justify-center select-none", className)}>
      <img
        src="/logo.png"
        alt={`${APP_NAME} Logo`}
        className={cn(
          "object-contain rounded-lg transition-transform duration-500 group-hover:scale-105 active:scale-95",
          sizes[size]
        )}
      />
    </div>
  );
};

export const LogoFull = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-3 group cursor-pointer", className)}>
      <Logo />
      <h1 className="bg-clip-text text-2xl font-black tracking-tighter text-transparent" style={{ backgroundImage: "var(--brand-logo-gradient)" }}>
        {APP_NAME}
      </h1>
    </div>
  );
};
