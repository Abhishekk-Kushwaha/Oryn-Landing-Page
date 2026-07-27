import React from "react";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import type { ViewType } from "../hooks/useAppRouter";
import {
  resolveDisplayName,
  resolveUserEmail,
  resolveUserInitial,
  type AppSession,
} from "../lib/account";

type AccountViewProps = {
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  session: AppSession;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  isProUser?: boolean;
  onUpgradeClick?: () => void;
};

type InlineStatus = {
  tone: "neutral" | "success" | "error";
  message: string;
};

const neutralActionStyle = {
  border: "1px solid var(--surface-border)",
  background: "var(--hover-overlay)",
  color: "var(--text-secondary)",
} as const;

function StatusMessage({ status }: { status: InlineStatus | null }) {
  if (!status) return null;

  const style =
    status.tone === "success"
      ? {
          border: "1px solid rgba(16,185,129,0.18)",
          background: "rgba(16,185,129,0.09)",
          color: "rgb(16 185 129)",
        }
      : status.tone === "error"
        ? {
            border: "1px solid rgba(244,63,94,0.16)",
            background: "rgba(244,63,94,0.09)",
            color: "rgb(225 29 72)",
          }
        : {
            border: "1px solid var(--surface-border)",
            background: "var(--hover-overlay)",
            color: "var(--text-secondary)",
          };

  return (
    <div
      className="rounded-[12px] px-3 py-2 text-[12px] font-medium"
      style={style}
    >
      {status.message}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-[14px] px-4 py-3"
      style={{
        border: "1px solid var(--surface-border)",
        background: "var(--stat-cell-bg)",
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 truncate text-[15px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

export function AccountView({
  setView,
  session,
  theme,
  setTheme,
  isProUser = false,
  onUpgradeClick,
}: AccountViewProps) {
  const displayName = resolveDisplayName(session);
  const userEmail = resolveUserEmail(session);
  const userInitial = resolveUserInitial(session);
  const [displayNameDraft, setDisplayNameDraft] = React.useState(displayName);
  const [displayNameStatus, setDisplayNameStatus] =
    React.useState<InlineStatus | null>(null);
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = React.useState(false);
  const memberSince = React.useMemo(() => {
    const rawDate = session?.user?.created_at;
    if (!rawDate) return "Recently joined";

    const parsed = parseISO(rawDate);
    if (Number.isNaN(parsed.getTime())) return "Recently joined";
    return format(parsed, "MMMM yyyy");
  }, [session?.user?.created_at]);

  React.useEffect(() => {
    setDisplayNameDraft(displayName);
  }, [displayName]);

  const canManageProfile = false;

  const handleDisplayNameSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setDisplayNameStatus(null);

    if (!canManageProfile) {
      setDisplayNameStatus({
        tone: "error",
        message: "Profile updates are unavailable right now.",
      });
      return;
    }

    const nextName = displayNameDraft.trim();
    if (nextName.length < 2) {
      setDisplayNameStatus({
        tone: "error",
        message: "Use at least 2 characters for the display name.",
      });
      return;
    }

    try {
      setIsUpdatingDisplayName(true);
      // Removed Supabase Call
      await new Promise(r => setTimeout(r, 1000));
      const result = { error: { message: "Local storage accounts cannot be updated" } };

      if (result?.error?.message) {
        setDisplayNameStatus({
          tone: "error",
          message: result.error.message,
        });
        return;
      }

      setDisplayNameDraft(nextName);
      setDisplayNameStatus({
        tone: "success",
        message: "Display name updated.",
      });
    } catch (error) {
      setDisplayNameStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not update the display name.",
      });
    } finally {
      setIsUpdatingDisplayName(false);
    }
  };

  return (
    <motion.div
      key="account"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-6xl p-4 md:p-8"
    >
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView("dashboard")}
            className="inline-flex h-11 items-center gap-2 rounded-[14px] px-4 text-sm font-semibold transition-colors"
            style={neutralActionStyle}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span
            className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{
              border: "1px solid var(--surface-border)",
              background: "var(--hover-overlay)",
              color: "var(--text-muted)",
            }}
          >
            Workspace Settings
          </span>
        </div>
        <p
          className="text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Manage your account, security, and preferences.
        </p>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-5 p-5 md:grid-cols-[auto_1fr] md:items-center md:p-6">
          <div
            className="flex h-[84px] w-[84px] items-center justify-center rounded-full text-[30px] font-black tracking-[-0.04em]"
            style={{
              border: "1px solid rgba(251,146,60,0.18)",
              background: "rgba(251,146,60,0.08)",
              color: "#fb923c",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
            }}
          >
            {userInitial}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500"
                style={{
                  borderColor: "rgba(16,185,129,0.16)",
                  background: "rgba(16,185,129,0.08)",
                }}
              >
                Personal Workspace
              </span>
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  borderColor: "var(--surface-border)",
                  background: "var(--hover-overlay)",
                  color: "var(--text-muted)",
                }}
              >
                Member since {memberSince}
              </span>
            </div>
            <h1
              className="mt-3 truncate text-[30px] font-black tracking-[-0.04em] md:text-[36px]"
              style={{ color: "var(--text-primary)" }}
            >
              {displayName}
            </h1>
            <p
              className="mt-2 truncate text-[15px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {userEmail || "No email connected to this session."}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5 md:p-6" delay={0.04}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "var(--text-faint)" }}
              >
                Account
              </p>
              <h2
                className="mt-2 text-[22px] font-bold tracking-[-0.03em]"
                style={{ color: "var(--text-primary)" }}
              >
                Identity
              </h2>
            </div>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[14px]"
              style={{
                border: "1px solid var(--surface-border)",
                background: "var(--hover-overlay)",
                color: "var(--text-secondary)",
              }}
            >
              <UserRound className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <form
              onSubmit={handleDisplayNameSubmit}
              className="rounded-[14px] px-4 py-3"
              style={{
                border: "1px solid var(--surface-border)",
                background: "var(--stat-cell-bg)",
              }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    Display name
                  </p>
                  <input
                    type="text"
                    value={displayNameDraft}
                    onChange={(event) => setDisplayNameDraft(event.target.value)}
                    className="mt-2 h-11 w-full rounded-[12px] px-3 text-sm font-medium oryn-input"
                    placeholder="Your name"
                    maxLength={60}
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    isUpdatingDisplayName ||
                    !canManageProfile ||
                    displayNameDraft.trim() === displayName
                  }
                  className="inline-flex h-11 items-center justify-center rounded-[12px] px-4 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  style={neutralActionStyle}
                >
                  {isUpdatingDisplayName ? "Saving..." : "Save"}
                </button>
              </div>
              <div className="mt-3">
                <StatusMessage status={displayNameStatus} />
              </div>
            </form>
            <DetailRow label="Email" value={userEmail || "Unavailable"} />
            <DetailRow label="Member since" value={memberSince} />
          </div>
        </Card>

        <Card className="p-5 md:p-6" delay={0.08}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "var(--text-faint)" }}
              >
                Preferences
              </p>
              <h2
                className="mt-2 text-[22px] font-bold tracking-[-0.03em]"
                style={{ color: "var(--text-primary)" }}
              >
                Theme
              </h2>
            </div>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[14px]"
              style={{
                border: "1px solid var(--surface-border)",
                background: "var(--hover-overlay)",
                color: "var(--text-secondary)",
              }}
            >
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </div>
          </div>

          <p
            className="mt-3 text-sm leading-6"
            style={{ color: "var(--text-secondary)" }}
          >
            Pick how the workspace should look every time you sign in.
          </p>

          <div
            className="mt-5 flex rounded-[16px] p-1"
            style={{
              border: "1px solid var(--surface-border)",
              background: "var(--stat-cell-bg)",
            }}
          >
            {(["light", "dark"] as const).map((option) => {
              const selected = theme === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTheme(option)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[12px] px-3 py-3 text-sm font-semibold transition-colors"
                  style={
                    selected
                      ? {
                          background: "var(--app-bg)",
                          color: "var(--text-primary)",
                          boxShadow: "var(--surface-shadow)",
                        }
                      : { color: "var(--text-muted)" }
                  }
                >
                  {option === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {option === "light" ? "Light" : "Dark"}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
