-- MoodSync engagement reminders setup
-- Run in Supabase SQL Editor before scheduling mood-daily-reminder.
-- The log prevents duplicate scheduled push notifications if the function runs more than once.

create table if not exists public.push_notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  event_type text not null,
  period_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_type, period_key)
);

create index if not exists push_notification_log_user_idx
  on public.push_notification_log(user_id, created_at desc);

create index if not exists push_notification_log_couple_idx
  on public.push_notification_log(couple_id, created_at desc);

alter table public.push_notification_log enable row level security;

-- Users do not need direct client access to this table; Edge Functions use service role.
-- Keep RLS closed for normal app users.
