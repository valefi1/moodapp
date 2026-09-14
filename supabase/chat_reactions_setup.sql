-- MoodSync: reactions attached to chat messages.
-- Safe to rerun in Supabase SQL Editor.

alter table public.posts
  add column if not exists reply_to_id uuid,
  add column if not exists reaction text;

drop index if exists public.posts_one_reaction_per_user_idx;
drop index if exists public.post_one_reaction_per_user_idx;

alter table public.posts
  drop constraint if exists posts_reaction_length_check;

alter table public.posts
  add constraint posts_reaction_length_check
  check (reaction is null or reaction in ('❤️', '🔥', '🥺', '😘', '🤗', '😂'));

-- Best-effort conversion of the old format. Old rows did not store a target
-- ID, so only reactions with exactly one plausible preceding message in the
-- same couple and a 10-minute window are linked automatically.
with legacy as (
  select r.id, r.couple_id, r.author_id,
         case when r.text ~ '^(❤️|🔥|🥺|😘|🤗|😂) reakce na zprávu$'
              then substring(r.text from '^(❤️|🔥|🥺|😘|🤗|😂)') end as emoji,
         r.created_at
  from public.posts r
  where r.type = 'chat'
    and r.reply_to_id is null
    and r.text ~ '^(❤️|🔥|🥺|😘|🤗|😂) reakce na zprávu$'
), candidates as (
  select l.id as reaction_id, l.emoji, m.id as message_id,
         row_number() over (partition by l.id order by l.created_at - m.created_at) as rn,
         count(*) over (partition by l.id) as candidate_count
  from legacy l
  join public.posts m
    on m.couple_id = l.couple_id
   and m.author_id <> l.author_id
   and m.type in ('chat', 'gif')
   and m.created_at < l.created_at
   and m.created_at >= l.created_at - interval '10 minutes'
)
update public.posts r
set type = 'reaction',
    reaction = c.emoji,
    text = c.emoji,
    reply_to_id = c.message_id
from candidates c
where r.id = c.reaction_id
  and c.rn = 1
  and c.candidate_count = 1;

-- The previous app could create several legacy rows for the same target.
-- Keep the newest one before adding the uniqueness rule.
delete from public.posts older
using public.posts newer
where older.type = 'reaction'
  and newer.type = 'reaction'
  and older.reply_to_id is not null
  and older.reply_to_id = newer.reply_to_id
  and older.author_id = newer.author_id
  and (
    older.created_at < newer.created_at
    or (older.created_at = newer.created_at and older.id::text < newer.id::text)
  );

-- Remove orphaned reaction rows before adding the self-reference.
delete from public.posts reaction
where reaction.type = 'reaction'
  and reaction.reply_to_id is not null
  and not exists (
    select 1 from public.posts target where target.id = reaction.reply_to_id
  );

alter table public.posts
  drop constraint if exists posts_reaction_target_check;

alter table public.posts
  add constraint posts_reaction_target_check
  check (type <> 'reaction' or reply_to_id is not null) not valid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_reply_to_id_fkey'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_reply_to_id_fkey
      foreign key (reply_to_id) references public.posts(id) on delete cascade;
  end if;
end
$$;

create unique index if not exists post_one_reaction_per_user_idx
  on public.posts(reply_to_id, author_id);

notify pgrst, 'reload schema';

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end
$$;
