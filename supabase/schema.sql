-- ============================================================
-- SkidHub — Supabase / PostgreSQL schema
-- ============================================================
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query)
-- for a fresh project. All writes go through Netlify Functions using the
-- service-role key, which bypasses RLS, so authorization is enforced in the
-- application layer. RLS is still enabled below as defence-in-depth: it
-- denies direct access from the public anon key.

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---- Enum-like role reference table -------------------------
create table if not exists roles (
  name        text primary key,
  rank        int  not null,
  description text
);

insert into roles (name, rank, description) values
  ('user',      1, 'Browse projects, favorite, and download permitted files'),
  ('moderator', 2, 'Upload projects and manage their own uploads'),
  ('owner',     3, 'Full administrative control')
on conflict (name) do nothing;

-- ---- Users --------------------------------------------------
create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  discord_id   text unique not null,
  username     text not null,
  display_name text,
  avatar       text,
  role         text not null default 'user' references roles(name),
  created_at   timestamptz not null default now()
);

create index if not exists users_role_idx on users(role);

-- ---- Projects -----------------------------------------------
create table if not exists projects (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text not null,
  version          text not null default '1.0.0',
  thumbnail        text,
  google_drive_url text not null,
  category         text not null default 'Other',
  tags             text[] not null default '{}',
  downloads        int not null default 0,
  file_size        text,
  -- Minimum role required to unlock the download button for this project.
  download_role    text not null default 'user' references roles(name),
  author           text not null,
  author_id        uuid references users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists projects_category_idx on projects(category);
create index if not exists projects_created_idx  on projects(created_at desc);
create index if not exists projects_downloads_idx on projects(downloads desc);
create index if not exists projects_author_idx    on projects(author_id);

-- ---- Favorites ----------------------------------------------
create table if not exists favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create index if not exists favorites_user_idx on favorites(user_id);

-- ---- Download logs ------------------------------------------
create table if not exists download_logs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete set null,
  user_id      uuid references users(id) on delete set null,
  username     text,
  project_name text,
  created_at   timestamptz not null default now()
);

create index if not exists download_logs_created_idx on download_logs(created_at desc);
create index if not exists download_logs_project_idx  on download_logs(project_id);

-- ---- Community submissions ----------------------------------
-- Copies people post themselves, linked on an external store (Meta /
-- Horizon Worlds or itch.io) instead of a Google Drive file.
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

create index if not exists submissions_created_idx on submissions(created_at desc);
create index if not exists submissions_author_idx  on submissions(author_id);

-- ---- Uploader applications ----------------------------------
-- Users apply for upload access; owners accept (which promotes the user to
-- moderator) or reject. One application per user.
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

-- ---- Row Level Security -------------------------------------
-- Service-role (used by the Netlify Functions) always bypasses RLS.
-- Enabling it here blocks anonymous/public clients from reading or writing
-- directly. The catalogue itself is served through the projects function.
alter table users         enable row level security;
alter table projects      enable row level security;
alter table favorites     enable row level security;
alter table download_logs enable row level security;
alter table submissions   enable row level security;
alter table applications  enable row level security;

-- Optional: allow the public anon key to read the catalogue directly.
-- Uncomment if you want client-side reads without going through a function.
-- create policy "public can read projects"
--   on projects for select
--   using (true);

-- Keep updated_at fresh on project edits.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();
