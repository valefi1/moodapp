-- MoodSync complete Supabase database setup
-- Generated from the individual setup files in this directory.
-- Safe to rerun: individual migrations use IF NOT EXISTS / idempotent policies.
-- This file changes database schema/policies/storage only; it does not deploy Edge Functions or secrets.



-- ============================================================================
-- SOURCE: push_notifications_setup.sql
-- ============================================================================

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
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.couple_members member
    where member.couple_id = push_subscriptions.couple_id
      and member.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.couple_members member
    where member.couple_id = push_subscriptions.couple_id
      and member.user_id = auth.uid()
  )
);


-- ============================================================================
-- SOURCE: challenges_2_setup.sql
-- ============================================================================

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


-- ============================================================================
-- SOURCE: partner_awarded_points_setup.sql
-- ============================================================================

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


-- ============================================================================
-- SOURCE: e2ee_media_setup.sql
-- ============================================================================

-- MoodSync E2EE media metadata
-- Run this in Supabase SQL Editor before deploying the E2EE build.

alter table public.posts
add column if not exists encrypted boolean default false,
add column if not exists encryption_iv text,
add column if not exists mime_type text;

alter table public.kama_progress
add column if not exists encrypted boolean default false,
add column if not exists encryption_iv text,
add column if not exists mime_type text;

alter table public.couples
add column if not exists avatar_encrypted boolean default false,
add column if not exists avatar_encryption_iv text,
add column if not exists avatar_mime_type text;

-- Optional sanity checks:
-- select encrypted, encryption_iv, mime_type from posts limit 5;
-- select encrypted, encryption_iv, mime_type from kama_progress limit 5;
-- select avatar_encrypted, avatar_encryption_iv, avatar_mime_type from couples limit 5;


-- ============================================================================
-- SOURCE: redgifs_setup.sql
-- ============================================================================

-- MoodSync RedGIF message metadata
-- Run this in Supabase SQL Editor before deploying the RedGIFs Edge Function.

alter table public.posts
  add column if not exists gif_external_id text,
  add column if not exists gif_source_url text,
  add column if not exists gif_media_url text,
  add column if not exists gif_thumbnail_url text,
  add column if not exists gif_embed_url text,
  add column if not exists gif_duration double precision,
  add column if not exists gif_width integer,
  add column if not exists gif_height integer,
  add column if not exists media_kind text,
  add column if not exists media_mime_type text,
  add column if not exists daily_moment_id uuid;

-- Optional sanity check:
-- select gif_external_id, gif_source_url, gif_media_url, gif_thumbnail_url, gif_embed_url,
--        gif_duration, gif_width, gif_height, media_kind, media_mime_type, daily_moment_id
-- from public.posts
-- limit 5;


-- ============================================================================
-- SOURCE: storage_couple_media_setup.sql
-- ============================================================================

-- MoodSync private media Storage setup
-- Run once in Supabase SQL Editor before enabling gallery or Dnešní moment.
-- This migration is intentionally separate from table migrations because it changes
-- Storage access for the existing couple-media bucket.

insert into storage.buckets (id, name, public)
values ('couple-media', 'couple-media', false)
on conflict (id) do update set public = false;

drop policy if exists "couple members can read couple media" on storage.objects;
drop policy if exists "couple members can upload couple media" on storage.objects;
drop policy if exists "couple members can update couple media" on storage.objects;
drop policy if exists "couple members can delete couple media" on storage.objects;

create policy "couple members can read couple media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'couple-media'
  and exists (
    select 1
    from public.couple_members member
    where member.user_id = auth.uid()
      and (storage.foldername(name))[1] = member.couple_id::text
  )
);

create policy "couple members can upload couple media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'couple-media'
  and exists (
    select 1
    from public.couple_members member
    where member.user_id = auth.uid()
      and (storage.foldername(name))[1] = member.couple_id::text
  )
);

create policy "couple members can update couple media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'couple-media'
  and exists (
    select 1
    from public.couple_members member
    where member.user_id = auth.uid()
      and (storage.foldername(name))[1] = member.couple_id::text
  )
)
with check (
  bucket_id = 'couple-media'
  and exists (
    select 1
    from public.couple_members member
    where member.user_id = auth.uid()
      and (storage.foldername(name))[1] = member.couple_id::text
  )
);

create policy "couple members can delete couple media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'couple-media'
  and exists (
    select 1
    from public.couple_members member
    where member.user_id = auth.uid()
      and (storage.foldername(name))[1] = member.couple_id::text
  )
);


-- ============================================================================
-- SOURCE: daily_moments_setup.sql
-- ============================================================================

-- MoodSync: Dnešní moment
-- Run this file in the Supabase SQL Editor before enabling the feature in the app.

-- The gallery mirror uses the existing posts table and remains safe to rerun.
alter table public.posts
  add column if not exists media_kind text,
  add column if not exists media_mime_type text,
  add column if not exists daily_moment_id uuid;

create table if not exists public.daily_moments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  moment_date date not null,
  media_path text,
  media_kind text,
  media_mime_type text,
  video_path text,
  video_mime_type text,
  duration_seconds numeric,
  encrypted boolean not null default false,
  encryption_iv text,
  caption text,
  created_at timestamptz default now(),
  unique (couple_id, author_id, moment_date),
  constraint daily_moments_media_kind_check check (media_kind in ('video', 'image')),
  constraint daily_moments_media_path_check check (media_path is not null or video_path is not null),
  constraint daily_moments_video_mime_type_check check (video_mime_type in ('video/webm', 'video/mp4', 'video/quicktime', 'video/x-m4v')),
  constraint daily_moments_duration_check check (duration_seconds is null or (duration_seconds > 0 and duration_seconds <= 30))
);

-- Backward-compatible upgrade for databases created by an older version of this file.
alter table public.daily_moments
  add column if not exists media_path text,
  add column if not exists media_kind text,
  add column if not exists media_mime_type text,
  add column if not exists video_path text,
  add column if not exists video_mime_type text,
  add column if not exists encrypted boolean not null default false,
  add column if not exists encryption_iv text;

alter table public.daily_moments
  alter column video_path drop not null,
  alter column video_mime_type drop not null;

update public.daily_moments
set media_path = coalesce(media_path, video_path),
    media_kind = coalesce(media_kind, 'video'),
    media_mime_type = coalesce(media_mime_type, video_mime_type)
where media_path is null
   or media_kind is null
   or media_mime_type is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_moments'::regclass
      and conname = 'daily_moments_media_kind_check'
  ) then
    alter table public.daily_moments
      add constraint daily_moments_media_kind_check
      check (media_kind in ('video', 'image'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_moments'::regclass
      and conname = 'daily_moments_media_path_check'
  ) then
    alter table public.daily_moments
      add constraint daily_moments_media_path_check
      check (media_path is not null or video_path is not null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_moments'::regclass
      and conname = 'daily_moments_video_mime_type_check'
  ) then
    alter table public.daily_moments
      add constraint daily_moments_video_mime_type_check
      check (video_mime_type in ('video/webm', 'video/mp4', 'video/quicktime', 'video/x-m4v')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_moments'::regclass
      and conname = 'daily_moments_duration_check'
  ) then
    alter table public.daily_moments
      add constraint daily_moments_duration_check
      check (duration_seconds is null or (duration_seconds > 0 and duration_seconds <= 30)) not valid;
  end if;
end
$$;

create table if not exists public.daily_moment_ratings (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.daily_moments(id) on delete cascade,
  rater_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  reaction text check (reaction is null or char_length(reaction) <= 280),
  created_at timestamptz default now(),
  unique (moment_id, rater_id)
);

create index if not exists daily_moments_couple_date_idx
  on public.daily_moments (couple_id, moment_date desc);

create index if not exists daily_moments_author_date_idx
  on public.daily_moments (author_id, moment_date desc);

create index if not exists daily_moment_ratings_moment_idx
  on public.daily_moment_ratings (moment_id);

create index if not exists daily_moment_ratings_rater_idx
  on public.daily_moment_ratings (rater_id);

create index if not exists posts_daily_moment_idx
  on public.posts (daily_moment_id)
  where daily_moment_id is not null;

alter table public.daily_moments enable row level security;
alter table public.daily_moment_ratings enable row level security;

drop policy if exists "couple members can read daily moments" on public.daily_moments;
drop policy if exists "authors can insert own daily moments" on public.daily_moments;
drop policy if exists "authors can update own daily moments" on public.daily_moments;
drop policy if exists "authors can delete own daily moments" on public.daily_moments;

create policy "couple members can read daily moments"
on public.daily_moments
for select
to authenticated
using (
  exists (
    select 1
    from public.couple_members member
    where member.couple_id = daily_moments.couple_id
      and member.user_id = auth.uid()
  )
);

create policy "authors can insert own daily moments"
on public.daily_moments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.couple_members member
    where member.couple_id = daily_moments.couple_id
      and member.user_id = auth.uid()
  )
);

create policy "authors can update own daily moments"
on public.daily_moments
for update
to authenticated
using (
  author_id = auth.uid()
  and exists (
    select 1
    from public.couple_members member
    where member.couple_id = daily_moments.couple_id
      and member.user_id = auth.uid()
  )
)
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.couple_members member
    where member.couple_id = daily_moments.couple_id
      and member.user_id = auth.uid()
  )
);

create policy "authors can delete own daily moments"
on public.daily_moments
for delete
to authenticated
using (
  author_id = auth.uid()
  and exists (
    select 1
    from public.couple_members member
    where member.couple_id = daily_moments.couple_id
      and member.user_id = auth.uid()
  )
);

drop policy if exists "couple members can read daily moment ratings" on public.daily_moment_ratings;
drop policy if exists "partners can insert daily moment ratings" on public.daily_moment_ratings;
drop policy if exists "partners can update daily moment ratings" on public.daily_moment_ratings;
drop policy if exists "partners can delete daily moment ratings" on public.daily_moment_ratings;

create policy "couple members can read daily moment ratings"
on public.daily_moment_ratings
for select
to authenticated
using (
  exists (
    select 1
    from public.daily_moments moment
    join public.couple_members member on member.couple_id = moment.couple_id
    where moment.id = daily_moment_ratings.moment_id
      and member.user_id = auth.uid()
  )
);

create policy "partners can insert daily moment ratings"
on public.daily_moment_ratings
for insert
to authenticated
with check (
  rater_id = auth.uid()
  and exists (
    select 1
    from public.daily_moments moment
    join public.couple_members member on member.couple_id = moment.couple_id
    where moment.id = daily_moment_ratings.moment_id
      and member.user_id = auth.uid()
      and moment.author_id <> auth.uid()
  )
);

create policy "partners can update daily moment ratings"
on public.daily_moment_ratings
for update
to authenticated
using (
  rater_id = auth.uid()
  and exists (
    select 1
    from public.daily_moments moment
    join public.couple_members member on member.couple_id = moment.couple_id
    where moment.id = daily_moment_ratings.moment_id
      and member.user_id = auth.uid()
      and moment.author_id <> auth.uid()
  )
)
with check (
  rater_id = auth.uid()
  and exists (
    select 1
    from public.daily_moments moment
    join public.couple_members member on member.couple_id = moment.couple_id
    where moment.id = daily_moment_ratings.moment_id
      and member.user_id = auth.uid()
      and moment.author_id <> auth.uid()
  )
);

create policy "partners can delete daily moment ratings"
on public.daily_moment_ratings
for delete
to authenticated
using (
  rater_id = auth.uid()
  and exists (
    select 1
    from public.daily_moments moment
    join public.couple_members member on member.couple_id = moment.couple_id
    where moment.id = daily_moment_ratings.moment_id
      and member.user_id = auth.uid()
      and moment.author_id <> auth.uid()
  )
);


-- ============================================================================
-- SOURCE: moodsync_daily_features_setup.sql
-- ============================================================================


create table if not exists public.couple_wishlist (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  fulfilled boolean not null default false,
  fulfilled_by uuid references auth.users(id) on delete set null,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.couple_wishlist enable row level security;

drop policy if exists "couple members can read wishlist" on public.couple_wishlist;
drop policy if exists "couple members can insert wishlist" on public.couple_wishlist;
drop policy if exists "couple members can update wishlist" on public.couple_wishlist;

create policy "couple members can read wishlist"
on public.couple_wishlist
for select
to authenticated
using (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple_wishlist.couple_id
    and cm.user_id = auth.uid()
  )
);

create policy "couple members can insert wishlist"
on public.couple_wishlist
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple_wishlist.couple_id
    and cm.user_id = auth.uid()
  )
);

create policy "couple members can update wishlist"
on public.couple_wishlist
for update
to authenticated
using (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple_wishlist.couple_id
    and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple_wishlist.couple_id
    and cm.user_id = auth.uid()
  )
);

create table if not exists public.couple_milestones (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  created_at timestamptz not null default now()
);

alter table public.couple_milestones enable row level security;

drop policy if exists "couple members can read milestones" on public.couple_milestones;
drop policy if exists "couple members can insert milestones" on public.couple_milestones;
drop policy if exists "couple members can update milestones" on public.couple_milestones;

create policy "couple members can read milestones"
on public.couple_milestones
for select
to authenticated
using (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple_milestones.couple_id
    and cm.user_id = auth.uid()
  )
);

create policy "couple members can insert milestones"
on public.couple_milestones
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple_milestones.couple_id
    and cm.user_id = auth.uid()
  )
);

create policy "couple members can update milestones"
on public.couple_milestones
for update
to authenticated
using (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple_milestones.couple_id
    and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple_milestones.couple_id
    and cm.user_id = auth.uid()
  )
);

-- Partner dne completions: one completion per user per day, points counted in challenge leaderboard.
create table if not exists public.partner_day_completions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null,
  card_key text,
  xp integer not null default 10,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(couple_id, user_id, completion_date)
);

alter table public.partner_day_completions enable row level security;

drop policy if exists "couple members can read partner day completions" on public.partner_day_completions;
drop policy if exists "users can insert own partner day completion" on public.partner_day_completions;
drop policy if exists "users can update own partner day completion" on public.partner_day_completions;

create policy "couple members can read partner day completions"
on public.partner_day_completions
for select
to authenticated
using (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = partner_day_completions.couple_id
    and cm.user_id = auth.uid()
  )
);

create policy "users can insert own partner day completion"
on public.partner_day_completions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = partner_day_completions.couple_id
    and cm.user_id = auth.uid()
  )
);

create policy "users can update own partner day completion"
on public.partner_day_completions
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = partner_day_completions.couple_id
    and cm.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = partner_day_completions.couple_id
    and cm.user_id = auth.uid()
  )
);


-- ============================================================================
-- SOURCE: engagement_reminders_setup.sql
-- ============================================================================

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


-- ============================================================================
-- SOURCE: kamasutra_upgrade_setup.sql
-- ============================================================================

-- MoodSync Kamasutra upgrade
-- Adds synced couple-level preference state for each position.

alter table public.kama_progress
add column if not exists desire_status text,
add column if not exists favorite boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'kama_progress_desire_status_check'
      and conrelid = 'public.kama_progress'::regclass
  ) then
    alter table public.kama_progress
    add constraint kama_progress_desire_status_check
    check (desire_status is null or desire_status in ('want', 'no'));
  end if;
end $$;

-- Optional sanity check:
-- select position_id, completed, desire_status, favorite from public.kama_progress limit 10;
