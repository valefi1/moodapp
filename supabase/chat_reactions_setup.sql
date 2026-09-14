-- MoodSync: reactions attached to chat messages.
-- Apply this migration in Supabase SQL Editor before deploying the matching frontend.

alter table public.posts
  add column if not exists reply_to_id uuid,
  add column if not exists reaction text;

create unique index if not exists posts_one_reaction_per_user_idx
  on public.posts(reply_to_id, author_id);

alter table public.posts
  drop constraint if exists posts_reaction_length_check;

alter table public.posts
  add constraint posts_reaction_length_check
  check (reaction is null or reaction in ('❤️', '🔥', '🥺', '😘', '🤗', '😂'));

-- Existing messages remain unchanged. Legacy text reactions cannot be reliably
-- attached retroactively because they did not store the target message ID.
