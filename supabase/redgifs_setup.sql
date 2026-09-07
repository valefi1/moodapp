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
add column if not exists gif_height integer;

-- Optional sanity check:
-- select gif_external_id, gif_source_url, gif_media_url, gif_thumbnail_url, gif_embed_url,
--        gif_duration, gif_width, gif_height
-- from public.posts
-- limit 5;
