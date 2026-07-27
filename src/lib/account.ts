export type AppUserMetadata = {
  full_name?: string | null;
  name?: string | null;
  is_pro?: boolean | null;
};

export type AppSession = {
  user?: {
    id?: string;
    email?: string | null;
    created_at?: string | null;
    user_metadata?: AppUserMetadata | null;
  };
} | null;

function toTitleCaseSegment(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function humanizeLocalPart(localPart: string) {
  const normalized = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "Account";

  return normalized
    .split(" ")
    .map((segment) => toTitleCaseSegment(segment))
    .join(" ");
}

export function resolveUserEmail(session: AppSession) {
  return session?.user?.email?.trim() || null;
}

export function resolveDisplayName(session: AppSession) {
  const metadata = session?.user?.user_metadata;
  const metadataName = metadata?.full_name?.trim() || metadata?.name?.trim();
  if (metadataName) return metadataName;

  const email = resolveUserEmail(session);
  if (email) {
    return humanizeLocalPart(email.split("@")[0] || "");
  }

  return "Account";
}

export function resolveUserInitial(session: AppSession) {
  const displayName = resolveDisplayName(session).trim();
  const initial = displayName.charAt(0).toUpperCase();
  return initial || "A";
}
