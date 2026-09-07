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
