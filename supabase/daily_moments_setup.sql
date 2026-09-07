-- MoodSync: Dnešní moment
-- Run this file in the Supabase SQL Editor before enabling the feature in the app.

create table if not exists public.daily_moments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  moment_date date not null,
  video_path text not null,
  video_mime_type text not null,
  duration_seconds numeric,
  caption text,
  created_at timestamptz default now(),
  unique (couple_id, author_id, moment_date),
  constraint daily_moments_video_mime_type_check check (video_mime_type in ('video/webm', 'video/mp4', 'video/quicktime', 'video/x-m4v')),
  constraint daily_moments_duration_check check (duration_seconds is null or (duration_seconds > 0 and duration_seconds <= 30))
);

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
