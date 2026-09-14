-- MoodSync: reactions attached to chat messages.
-- Safe to rerun in Supabase SQL Editor.

alter table public.posts
  add column if not exists reply_to_id uuid,
  add column if not exists reaction text;

-- Keep one reaction per author and target message. NULL reply_to_id values
-- (all ordinary posts) remain distinct in PostgreSQL unique indexes.
drop index if exists public.posts_one_reaction_per_user_idx;
create unique index if not exists public.post_one_reaction_per_user_idx
  on public.posts(reply_to_id, author_id);

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

notify pgrst, 'reload schema';
