-- ============================================================
-- Phase 2: Course Management Tables
-- ============================================================

-- courses table
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null,
  description text,
  semester    text not null,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- course_students join table (enrollment — fully populated in Phase 3 Student Management)
create table if not exists public.course_students (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(course_id, student_id)
);

-- ── RLS ─────────────────────────────────────────────────────

alter table public.courses enable row level security;
alter table public.course_students enable row level security;

-- Admins: full CRUD on their own courses
create policy "Admins can select own courses"
  on public.courses for select
  using (auth.uid() = created_by);

create policy "Admins can insert courses"
  on public.courses for insert
  with check (auth.uid() = created_by);

create policy "Admins can update own courses"
  on public.courses for update
  using (auth.uid() = created_by);

create policy "Admins can delete own courses"
  on public.courses for delete
  using (auth.uid() = created_by);

-- Students: can view courses they are enrolled in
create policy "Students can select enrolled courses"
  on public.courses for select
  using (
    exists (
      select 1 from public.course_students cs
      where cs.course_id = id
        and cs.student_id = auth.uid()
    )
  );

-- course_students: admins can manage enrollments for their courses
create policy "Admins can manage enrollments for own courses"
  on public.course_students for all
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and c.created_by = auth.uid()
    )
  );

-- Students can view their own enrollment rows
create policy "Students can view own enrollments"
  on public.course_students for select
  using (auth.uid() = student_id);

-- Admins can SELECT student profiles (needed for Phase 4 Student Management)
create policy "Admins can view student profiles"
  on public.profiles for select
  using (
    role = 'student'
    or auth.uid() = id
  );
