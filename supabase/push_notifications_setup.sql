-- MoodSync push notifications setup
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  user_agent text,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id)
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Members can manage own push subscriptions" on public.push_subscriptions;

create policy "Members can manage own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
