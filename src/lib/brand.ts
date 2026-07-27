export const APP_NAME = "Oryn";

const STORAGE_KEYS = {
  activeGoalId: "oryn_active_goal_id",
  dashboardLayout: "oryn_dashboard_layout",
  featuredGoalId: "oryn_featured_goal_id",
  navOrder: "oryn_nav_order",
  theme: "oryn_theme",
} as const;

const LEGACY_STORAGE_KEYS: Record<keyof typeof STORAGE_KEYS, string> = {
  activeGoalId: "forge_active_goal_id",
  dashboardLayout: "forge_dashboard_layout",
  featuredGoalId: "forge_featured_goal_id",
  navOrder: "forge_nav_order",
  theme: "forge_theme",
};

type BrandStorageKey = keyof typeof STORAGE_KEYS;

export function readBrandStorage(key: BrandStorageKey) {
  if (typeof window === "undefined") return null;

  const currentValue = window.localStorage.getItem(STORAGE_KEYS[key]);
  if (currentValue !== null) return currentValue;

  const legacyValue = window.localStorage.getItem(LEGACY_STORAGE_KEYS[key]);
  if (legacyValue !== null) {
    window.localStorage.setItem(STORAGE_KEYS[key], legacyValue);
    window.localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
  }

  return legacyValue;
}

export function writeBrandStorage(key: BrandStorageKey, value: string) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEYS[key], value);
  window.localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
}

export function removeBrandStorage(key: BrandStorageKey) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEYS[key]);
  window.localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
}
