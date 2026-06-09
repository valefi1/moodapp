
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
