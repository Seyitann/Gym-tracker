-- =====================================================================
-- Gym Tracker: database schema for Supabase
-- Run this once in: Supabase dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- One profile per user, linked to Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  goal text,
  height_cm float8,
  starting_weight float8,
  target_weight float8,
  workout_days text not null default '1,3,5',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- Shared exercise library (read-only for users)
create table if not exists public.workouts (
  id bigint generated always as identity primary key,
  name text not null unique,
  category text not null,
  muscle_group text not null,
  equipment text not null,
  difficulty text not null,
  duration_mins int not null,
  calories_estimate int not null,
  instructions text not null
);

create table if not exists public.weight_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weight float8 not null,
  logged_at date not null default current_date
);

create table if not exists public.workout_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id bigint not null references public.workouts(id),
  logged_at timestamptz not null default now(),
  duration_mins int,
  sets int,
  reps int,
  weight_used float8,
  notes text
);

create table if not exists public.body_measurements (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  measurement_type text not null,
  value float8 not null,
  logged_at date not null default current_date
);

create table if not exists public.progress_photos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  photo_type text not null check (photo_type in ('before', 'after')),
  image_path text not null,
  uploaded_at timestamptz not null default now()
);

-- Create a profile row automatically whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================================
-- Row Level Security: every user can only see and change their own rows
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.weight_logs enable row level security;
alter table public.workout_logs enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progress_photos enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "workouts are public to read" on public.workouts;
create policy "workouts are public to read" on public.workouts
  for select using (true);

drop policy if exists "own weight logs" on public.weight_logs;
create policy "own weight logs" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own workout logs" on public.workout_logs;
create policy "own workout logs" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own measurements" on public.body_measurements;
create policy "own measurements" on public.body_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own photo rows" on public.progress_photos;
create policy "own photo rows" on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- Private storage bucket for progress photos (one folder per user)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "own photo files" on storage.objects;
create policy "own photo files" on storage.objects
  for all
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
