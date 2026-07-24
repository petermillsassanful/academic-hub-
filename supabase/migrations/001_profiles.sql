-- ============================================================
-- Academic Hub — Phase 1 Database Migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles table
-- Linked to auth.users via foreign key
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  role text not null check (role in ('admin', 'student')),
  created_at timestamptz default now() not null
);

-- Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Allow profile insert via trigger (security definer function)
create policy "Service role can insert profiles"
  on public.profiles
  for insert
  with check (true);

-- ============================================================
-- Trigger: auto-create profile row on new auth user signup
-- Reads full_name and role from user_metadata set during signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

-- Drop trigger if it already exists (for re-runs)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ============================================================
-- Future phases will add tables here:
-- courses, enrollments, assignments, submissions, grades, etc.
-- ============================================================
