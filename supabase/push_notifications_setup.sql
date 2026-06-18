-- MoodSync push notifications setup
-- Run this in Supabase SQL editor after deploying the app.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text,
  subscription jsonb not null,
  user_agent text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.push_subscriptions add column if not exists endpoint text;

update public.push_subscriptions
set endpoint = subscription->>'endpoint'
where endpoint is null and subscription ? 'endpoint';

-- Starší verze měla unique(user_id), což rozbíjelo více zařízení pro stejného uživatele.
do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.push_subscriptions'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) = 'UNIQUE (user_id)'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.push_subscriptions drop constraint %I', constraint_name);
  end if;
end $$;

delete from public.push_subscriptions
where endpoint is null or endpoint = '';

alter table public.push_subscriptions alter column endpoint set not null;

create unique index if not exists push_subscriptions_endpoint_key
on public.push_subscriptions(endpoint);

create index if not exists push_subscriptions_couple_user_idx
on public.push_subscriptions(couple_id, user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Members can manage own push subscriptions" on public.push_subscriptions;

create policy "Members can manage own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
