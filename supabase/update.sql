-- ============================================================
-- SkidHub — combined update migration
-- ============================================================
-- Run this ONCE in the Supabase SQL editor. It is idempotent and safe to
-- re-run. It brings an existing database up to date with:
--   * community submissions (+ discord_invite shown on each game)
--   * uploader applications (with a discord invite field)

create extension if not exists "pgcrypto";

-- ---- Users: approval to post copies -------------------------
alter table users add column if not exists can_post boolean not null default false;

-- ---- Community submissions ----------------------------------
create table if not exists submissions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  thumbnail   text,
  store_url   text not null,
  store_type  text not null default 'itch' check (store_type in ('meta','itch')),
  discord_invite text,
  author      text not null,
  author_id   uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);
-- Add the column for databases that created submissions before this field.
alter table submissions add column if not exists discord_invite text;

create index if not exists submissions_created_idx on submissions(created_at desc);
create index if not exists submissions_author_idx  on submissions(author_id);
alter table submissions enable row level security;

-- ---- Uploader applications ----------------------------------
create table if not exists applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  discord_username text not null,
  game_link        text not null,
  known_as         text not null,
  game_image       text,
  discord_invite   text not null default '',
  reason           text not null,
  status           text not null default 'pending'
                     check (status in ('pending','accepted','rejected')),
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz,
  unique (user_id)
);
alter table applications add column if not exists discord_invite text not null default '';

create index if not exists applications_status_idx on applications(status);
alter table applications enable row level security;
