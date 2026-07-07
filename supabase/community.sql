-- ============================================================
-- SkidHub — migration: community submissions
-- ============================================================
-- Run this ONCE in the Supabase SQL editor if you already created your
-- database with the original schema.sql (which had no `submissions` table).
-- Safe to re-run: it only creates things if they don't already exist.

create extension if not exists "pgcrypto";

create table if not exists submissions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  thumbnail   text,
  store_url   text not null,
  store_type  text not null default 'itch' check (store_type in ('meta','itch')),
  author      text not null,
  author_id   uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists submissions_created_idx on submissions(created_at desc);
create index if not exists submissions_author_idx  on submissions(author_id);

alter table submissions enable row level security;
