-- MoodSync partner-awarded points setup
-- Run this in Supabase SQL Editor after the previous MoodSync setup files.
-- Goal: nobody awards XP to themselves; partner-day XP and challenge XP are confirmed by the other partner.

alter table public.partner_day_completions
add column if not exists awarded_by uuid references auth.users(id),
add column if not exists approved_at timestamptz;

alter table public.challenges
add column if not exists completed_confirmed_by uuid references auth.users(id);

create index if not exists partner_day_awarded_by_date_idx
on public.partner_day_completions (couple_id, awarded_by, completion_date);

create index if not exists challenges_completed_confirmed_by_idx
on public.challenges (couple_id, completed_confirmed_by);

-- Replace the old self-completion policies with partner-award policies.
drop policy if exists "users can insert own partner day completion" on public.partner_day_completions;
drop policy if exists "users can update own partner day completion" on public.partner_day_completions;
drop policy if exists "couple members can insert partner day completion awards" on public.partner_day_completions;
drop policy if exists "couple members can update partner day completion awards" on public.partner_day_completions;

create policy "couple members can insert partner day completion awards"
on public.partner_day_completions
for insert
to authenticated
with check (
  awarded_by = auth.uid()
  and user_id <> auth.uid()
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = partner_day_completions.couple_id
    and cm.user_id = auth.uid()
  )
  and exists (
    select 1 from public.couple_members recipient
    where recipient.couple_id = partner_day_completions.couple_id
    and recipient.user_id = partner_day_completions.user_id
  )
);

create policy "couple members can update partner day completion awards"
on public.partner_day_completions
for update
to authenticated
using (
  user_id <> auth.uid()
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = partner_day_completions.couple_id
    and cm.user_id = auth.uid()
  )
)
with check (
  awarded_by = auth.uid()
  and user_id <> auth.uid()
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = partner_day_completions.couple_id
    and cm.user_id = auth.uid()
  )
  and exists (
    select 1 from public.couple_members recipient
    where recipient.couple_id = partner_day_completions.couple_id
    and recipient.user_id = partner_day_completions.user_id
  )
);
