alter table public.habits
  add column if not exists description text null,
  add column if not exists color text null,
  add column if not exists archived_at timestamptz null,
  add column if not exists archive_expires_at timestamptz null;

create index if not exists habits_user_archive_idx
  on public.habits (user_id, archived_at, archive_expires_at);

alter table public.goals
  add column if not exists archived_at timestamptz null,
  add column if not exists archive_expires_at timestamptz null;

create index if not exists goals_user_archive_idx
  on public.goals (user_id, archived_at, archive_expires_at);
