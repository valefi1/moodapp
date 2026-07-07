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
