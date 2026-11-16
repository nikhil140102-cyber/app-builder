-- App Builder database schema for Supabase (version 3: accounts, admin, blocking, live previews).
-- Run in Supabase → SQL Editor → New query → Run.
-- Safe to run again: it creates what is missing and refreshes the rules.

-- 1. Apps people design ------------------------------------------------------
create table if not exists public.projects (
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  name       text not null default 'Untitled app',
  page_count int  not null default 1,
  doc        jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);
create index if not exists projects_owner_updated on public.projects (owner_id, updated_at desc);

-- 2. One profile per user (filled automatically on sign-up) -----------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now(),
  blocked    boolean not null default false
);

-- 3. Platform admins (add yourself with the statement at the bottom) --------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Helper checks. "security definer" lets them read the tables without
-- being limited by the row rules below, which avoids rule loops.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.is_blocked() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select blocked from public.profiles where id = auth.uid()), false);
$$;

-- Create a profile whenever someone signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for people who signed up before this script ran.
insert into public.profiles (id, email, full_name, created_at)
select id, email, raw_user_meta_data ->> 'full_name', created_at from auth.users
on conflict (id) do nothing;

-- 4. Row level security --------------------------------------------------------
alter table public.projects enable row level security;
alter table public.profiles enable row level security;
alter table public.admins   enable row level security;

drop policy if exists "Read own projects"   on public.projects;
drop policy if exists "Create own projects" on public.projects;
drop policy if exists "Update own projects" on public.projects;
drop policy if exists "Delete own projects" on public.projects;

-- Users manage their own apps unless blocked; admins can read every app.
create policy "Read own projects" on public.projects for select to authenticated
  using (((select auth.uid()) = owner_id and not (select public.is_blocked())) or (select public.is_admin()));
create policy "Create own projects" on public.projects for insert to authenticated
  with check ((select auth.uid()) = owner_id and not (select public.is_blocked()));
create policy "Update own projects" on public.projects for update to authenticated
  using ((select auth.uid()) = owner_id and not (select public.is_blocked()))
  with check ((select auth.uid()) = owner_id and not (select public.is_blocked()));
create policy "Delete own projects" on public.projects for delete to authenticated
  using ((select auth.uid()) = owner_id and not (select public.is_blocked()));

drop policy if exists "Read own profile or admin" on public.profiles;
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Read own profile or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
-- Only admins can change profiles (so nobody can unblock themselves).
create policy "Admins update profiles" on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "See own admin row" on public.admins;
create policy "See own admin row" on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- 5. Live preview links (/p/<token>) ----------------------------------------
create table if not exists public.previews (
  token      text primary key,
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  doc        jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.previews enable row level security;

drop policy if exists "Owners manage previews" on public.previews;
create policy "Owners manage previews" on public.previews for all to authenticated
  using ((select auth.uid()) = owner_id and not (select public.is_blocked()))
  with check ((select auth.uid()) = owner_id and not (select public.is_blocked()));

-- Anyone holding a link can read that one preview, but cannot list them.
create or replace function public.get_preview(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select pr.doc from public.previews pr
  join public.profiles pf on pf.id = pr.owner_id
  where pr.token = p_token and not pf.blocked;
$$;
revoke all on function public.get_preview(text) from public;
grant execute on function public.get_preview(text) to anon, authenticated;

-- 6. Make yourself an admin -------------------------------------------------
-- Replace the email with the one you signed up with, then run just this line:
-- insert into public.admins (user_id) select id from auth.users where email = 'you@example.com' on conflict do nothing;
