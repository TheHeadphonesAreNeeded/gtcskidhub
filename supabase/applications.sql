-- ============================================================
-- SkidHub — migration: uploader applications
-- ============================================================
-- Run this ONCE in the Supabase SQL editor if your database was created
-- before the application system existed. Safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  discord_username text not null,
  game_link        text not null,
  known_as         text not null,
  game_image       text,
  discord_invite   text not null,
  reason           text not null,
  status           text not null default 'pending'
                     check (status in ('pending','accepted','rejected')),
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz,
  unique (user_id)
);

create index if not exists applications_status_idx on applications(status);

alter table applications enable row level security;
