-- MoodSync Challenges 2.0 schema
-- Run in Supabase SQL Editor.

alter table public.challenges
add column if not exists assigned_to uuid references auth.users(id),
add column if not exists challenged_by uuid references auth.users(id),
add column if not exists challenge_deadline timestamptz,
add column if not exists challenge_status text default 'open',
add column if not exists penalty_points integer,
add column if not exists failed_at timestamptz,
add column if not exists debt_task text,
add column if not exists debt_repaid_at timestamptz,
add column if not exists completed_by uuid references auth.users(id);

create index if not exists challenges_couple_status_deadline_idx
on public.challenges (couple_id, challenge_status, challenge_deadline);

-- Optional cleanup for inconsistent older rows:
-- update public.challenges set challenge_status = 'completed' where completed = true and challenge_status is null;
