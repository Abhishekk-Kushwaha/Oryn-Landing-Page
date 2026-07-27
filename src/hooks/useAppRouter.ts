import { useState, useEffect } from "react";

export type ViewType =
  | "today"
  | "dashboard"
  | "account"
  | "detail"
  | "goal-insights"
  | "archive"
  | "categories"
  | "calendar"
  | "planner"
  | "goals"
  | "assign-tasks"
  | "habits";

export const VALID_VIEWS: ViewType[] = [
  "today",
  "dashboard",
  "account",
  "detail",
  "goal-insights",
  "archive",
  "categories",
  "calendar",
  "planner",
  "goals",
  "assign-tasks",
  "habits",
];

export function useAppRouter() {
  const [view, setView] = useState<ViewType>(() => {
    const hash = window.location.hash.replace("#", "");
    return VALID_VIEWS.includes(hash as ViewType) ? (hash as ViewType) : "today";
  });

  // Sync hash changes to view state (handles back button)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (VALID_VIEWS.includes(hash as ViewType)) {
        setView(hash as ViewType);
      } else if (!hash) {
        setView("today");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Sync view state to hash
  useEffect(() => {
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash !== view) {
      window.history.replaceState(
        window.history.state?.modal ? null : { orynDemoEntry: true },
        "",
        `#${view}`,
      );
    }
  }, [view]);

  return { view, setView };
}
