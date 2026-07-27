import React from "react";
import {
  Calendar,
  CalendarDays,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Target,
  Activity,
  X,
  type LucideIcon,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_NAME } from "../lib/brand";
import type { ViewType } from "../hooks/useAppRouter";
import type { AppSession } from "../lib/account";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SidebarNavView = ViewType | "dash";

type SidebarNavItem = {
  id: SidebarNavView;
  icon: LucideIcon;
  label: string;
};

type SidebarProps = {
  view: ViewType;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  setActiveGoalId: (id: string | null) => void;
  isMenuOpen?: boolean;
  setIsMenuOpen?: (open: boolean) => void;
  stats?: { avgProgress?: number };
  todayProgress?: number;
  session?: AppSession;
  theme?: "light" | "dark";
  setTheme?: (t: "light" | "dark") => void;
  isProUser?: boolean;
  onUpgradeClick?: () => void;
  onExit?: () => void;
};

export function Sidebar(props: SidebarProps) {
  const {
    view,
    setView,
    setActiveGoalId,
    isMenuOpen = false,
    setIsMenuOpen,
    stats,
    todayProgress = 0,
    session,
    theme = "light",
    setTheme,
    isProUser = false,
    onUpgradeClick,
    onExit,
  } = props;

  // Mobile bottom nav — UNCHANGED
  const mobileNavItems: SidebarNavItem[] = [
    { id: "today", icon: Target, label: "Today" },
    { id: "planner", icon: CalendarDays, label: "Planner" },
    { id: "habits", icon: Activity, label: "Habits" },
    { id: "goals", icon: LayoutDashboard, label: "Goals" },
    { id: "dashboard", icon: Sun, label: "Profile" },
  ];

  // Mobile drawer nav — UNCHANGED
  const drawerNavItems: SidebarNavItem[] = [
    { id: "today", icon: Sun, label: "Today" },
    { id: "dashboard", icon: LayoutDashboard, label: "Profile" },
    { id: "habits", icon: Activity, label: "Habits" },
    { id: "goals", icon: Target, label: "Goals" },
    { id: "categories", icon: Filter, label: "Categories" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
  ];

  // Desktop permanent sidebar nav
  const desktopNavItems: SidebarNavItem[] = [
    { id: "today", icon: Target, label: "Today" },
    { id: "goals", icon: LayoutDashboard, label: "Goals" },
    { id: "habits", icon: Activity, label: "Habits" },
    { id: "planner", icon: CalendarDays, label: "Planner" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "categories", icon: Filter, label: "Categories" },
    { id: "dashboard", icon: Sun, label: "Profile" },
  ];

  const overallProgress = Math.max(
    0,
    Math.min(100, Math.round(stats?.avgProgress || 0)),
  );

  const isActive = (id: SidebarNavView) =>
    view === id ||
    (id === "goals" && view === "detail") ||
    (id === "dashboard" && view === "account");

  const navigate = (id: SidebarNavView) => {
    setView(id as ViewType);
    if (id !== "goals") setActiveGoalId(null);
  };

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen?.(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, setIsMenuOpen]);

  return (
    <>
      {/* ══════════════════════════════════════════
          PERMANENT DESKTOP SIDEBAR  (md+ only)
          Never rendered on mobile — md:flex hidden
         ══════════════════════════════════════════ */}
      <aside
        className="hidden md:flex h-screen w-64 shrink-0 flex-col"
        style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
      >

        {/* Logo */}
        <div
          className="flex items-center gap-3.5 px-5 py-[22px]"
          style={{ borderBottom: "1px solid var(--sidebar-divider)" }}
        >
          <button
            type="button"
            onClick={() => navigate("today")}
            className="group flex items-center gap-3"
          >
            <img
              src="/logo.png"
              className="h-11 w-11 object-contain rounded-[12px] select-none transition-transform duration-200 group-hover:scale-[1.06]"
              alt="Oryn Logo"
            />
            <span
              className="bg-clip-text text-[21px] font-black tracking-[-0.04em] text-transparent"
              style={{ backgroundImage: "var(--brand-logo-gradient)" }}
            >
              {APP_NAME}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-0.5">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={cn(
                  "group relative flex h-[44px] w-full items-center gap-3 rounded-[11px] px-3.5 text-left text-[13.5px] font-semibold tracking-[-0.01em] transition-all duration-150",
                )}
                style={{
                  background: active ? "var(--sidebar-item-active-bg)" : undefined,
                  color: active ? "var(--sidebar-item-active-color)" : "var(--sidebar-item-inactive-color)",
                  boxShadow: active ? "var(--sidebar-item-active-shadow)" : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--sidebar-item-hover-bg)";
                    e.currentTarget.style.color = "var(--sidebar-item-hover-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "";
                    e.currentTarget.style.color = "var(--sidebar-item-inactive-color)";
                  }
                }}
              >
                {/* Active left-edge indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-orange-400 shadow-[0_0_10px_2px_rgba(249,115,22,0.45)]" />
                )}
                <Icon
                  className="h-[16px] w-[16px] shrink-0 transition-colors duration-150"
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Divider label */}
        <div className="px-6 pb-2">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--sidebar-label-muted)" }}
          >
            Settings
          </span>
        </div>

        {/* Bottom section */}
        <div
          className="px-3 pb-4 pt-3 space-y-3"
          style={{ borderTop: "1px solid var(--sidebar-divider)" }}
        >
          {/* Overall progress card */}
          <div
            className="rounded-[13px] px-4 py-3.5"
            style={{ border: "1px solid var(--sidebar-progress-border)", background: "var(--sidebar-progress-bg)" }}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300/72">
                Progress
              </span>
              <span className="text-[17px] font-black tracking-[-0.02em] text-orange-300">
                {todayProgress}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--sidebar-progress-track)" }}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700 shadow-[0_0_6px_rgba(249,115,22,0.5)]"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
          </div>

          {!isProUser && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="w-full flex items-center justify-center gap-2 rounded-[13px] bg-gradient-to-r from-emerald-500 to-teal-400 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Upgrade to Pro
            </button>
          )}

          {/* Theme + Account row */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setTheme?.(theme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors"
              style={{ border: "1px solid var(--drawer-theme-btn-border)", background: "var(--drawer-theme-btn-bg)", color: "var(--drawer-theme-btn-color)" }}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>

            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[11px] font-bold transition-all duration-150"
                style={{
                  border: "1px solid var(--sidebar-progress-border)",
                  background: "var(--sidebar-progress-bg)",
                  color: "var(--sidebar-item-inactive-color)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--sidebar-item-active-color)";
                  e.currentTarget.style.background = "var(--sidebar-item-active-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--sidebar-item-inactive-color)";
                  e.currentTarget.style.background = "var(--sidebar-progress-bg)";
                }}
              >
                <LogOut className="h-3.5 w-3.5 rotate-180" />
                <span>Exit Demo</span>
              </button>
            )}
          </div>
        </div>
      </aside>


      {/* ══════════════════════════════════════════
          MOBILE SLIDE-IN DRAWER (hidden on desktop)
         ══════════════════════════════════════════ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex h-screen shrink-0 flex-col overflow-hidden px-7 py-8 shadow-[34px_0_100px_-54px_rgba(0,0,0,1)] transition-[width,opacity,transform] duration-300 md:hidden",
          isMenuOpen
            ? "w-[360px] translate-x-0 opacity-100"
            : "w-0 -translate-x-2 px-0 opacity-0",
        )}
        style={{
          background: "var(--drawer-bg)",
          borderRight: "1px solid var(--drawer-border)",
          color: "var(--text-primary)",
        }}
        aria-hidden={!isMenuOpen}
      >
        <div className="mb-12 flex min-w-[304px] items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("today")}
            className="group flex items-center gap-4"
          >
            <img
              src="/logo.png"
              className="h-[58px] w-[58px] object-contain rounded-[16px] select-none transition-transform duration-200 group-hover:scale-[1.03]"
              alt="Oryn Logo"
            />
            <h1
              className="bg-clip-text text-[30px] font-black tracking-[-0.04em] text-transparent"
              style={{ backgroundImage: "var(--brand-logo-gradient)" }}
            >
              {APP_NAME}
            </h1>
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen?.(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
            style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="min-w-[304px] space-y-2">
          {drawerNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={cn(
                  "flex h-[60px] w-full items-center gap-4 rounded-[18px] px-5 text-left text-[19px] font-bold tracking-[-0.01em] transition-all",
                )}
                style={{
                  background: active ? "var(--drawer-item-active-bg)" : undefined,
                  color: active ? "var(--drawer-item-active-color)" : "var(--drawer-item-inactive-color)",
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-12 flex min-w-[304px] items-center justify-between px-2">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--drawer-label)" }}
          >
            My Goals
          </span>
          <button
            type="button"
            onClick={() => navigate("goals")}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--hover-overlay)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            aria-label="Open goals"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div
          className="mt-auto min-w-[304px] pt-7"
          style={{ borderTop: "1px solid var(--drawer-divider)" }}
        >
          <div className="mb-7 flex items-center justify-between">
            <span className="text-[16px] font-bold" style={{ color: "var(--text-secondary)" }}>Theme</span>
            <button
              type="button"
              onClick={() => setTheme?.(theme === "dark" ? "light" : "dark")}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px]"
              style={{ border: "1px solid var(--drawer-theme-btn-border)", background: "var(--drawer-theme-btn-bg)", color: "var(--drawer-theme-btn-color)" }}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>

          {onExit && (
            <div className="mb-8 flex items-center justify-between">
              <span className="min-w-0 pr-4 text-[16px] font-bold" style={{ color: "var(--text-secondary)" }}>
                Exit Demo
              </span>
              <button
                type="button"
                onClick={onExit}
                className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] transition-transform active:scale-95"
                style={{ border: "1px solid var(--drawer-theme-btn-border)", background: "var(--drawer-theme-btn-bg)", color: "var(--drawer-theme-btn-color)" }}
                aria-label="Back to Landing Page"
              >
                <LogOut className="h-5 w-5 rotate-180" />
              </button>
            </div>
          )}

          <div
            className="rounded-[22px] p-5"
            style={{ border: "1px solid var(--sidebar-progress-border)", background: "var(--sidebar-progress-bg)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.22em] text-orange-300">
                Progress
              </span>
              <span className="text-[22px] font-black tracking-[-0.02em] text-orange-300">
                {todayProgress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--sidebar-progress-track)" }}>
              <div
                className="h-full rounded-full bg-orange-400 transition-all duration-500"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
          </div>
          
          {!isProUser && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-emerald-500 to-teal-400 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98]"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MOBILE BOTTOM NAV  — 100% UNCHANGED
         ══════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.15)] backdrop-blur-2xl transition-all md:hidden"
        style={{ background: "var(--nav-bg)", borderTop: "1px solid var(--nav-border)" }}
      >
        <div className="mx-auto flex max-w-md items-center justify-around p-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id as ViewType);
                if (item.id !== "goals") setActiveGoalId(null);
              }}
              className={cn(
                "group relative flex h-14 w-16 flex-col items-center justify-center rounded-xl transition-all duration-300",
              )}
              style={{ color: active ? "var(--nav-active-color)" : "var(--nav-inactive-color)" }}
            >
              <div
                className={cn(
                  "rounded-xl p-1.5 transition-transform duration-300",
                  active
                    ? "scale-110 drop-shadow-sm"
                    : "group-hover:scale-110",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-semibold uppercase tracking-wider transition-opacity",
                  active ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                )}
              >
                {item.label}
              </span>
            </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
