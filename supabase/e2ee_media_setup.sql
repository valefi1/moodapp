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
