-- ============================================================
-- Phase 3: Content Upload
-- Tables: course_materials, course_recordings
-- ============================================================

-- course_materials: notes, slides, PDFs
create table if not exists public.course_materials (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text,
  file_url    text not null,
  file_type   text not null,   -- 'pdf', 'pptx', 'docx', etc.
  file_size   bigint not null default 0,
  week_number int  not null default 1,
  uploaded_at timestamptz not null default now()
);

-- course_recordings: lecture videos / audio
create table if not exists public.course_recordings (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  file_url    text not null,
  file_type   text not null,   -- 'mp4', 'mp3', 'wav'
  file_size   bigint not null default 0,
  week_number int  not null default 1,
  uploaded_at timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.course_materials  enable row level security;
alter table public.course_recordings enable row level security;

-- Admins: full CRUD on materials for courses they own
create policy "Admins select own course materials"
  on public.course_materials for select
  using (public.is_course_owner(course_id));

create policy "Admins insert materials"
  on public.course_materials for insert
  with check (public.is_course_owner(course_id));

create policy "Admins update materials"
  on public.course_materials for update
  using (public.is_course_owner(course_id));

create policy "Admins delete materials"
  on public.course_materials for delete
  using (public.is_course_owner(course_id));

-- Students: select-only for enrolled courses
create policy "Students select enrolled course materials"
  on public.course_materials for select
  using (public.is_enrolled_in_course(course_id));

-- Admins: full CRUD on recordings for courses they own
create policy "Admins select own course recordings"
  on public.course_recordings for select
  using (public.is_course_owner(course_id));

create policy "Admins insert recordings"
  on public.course_recordings for insert
  with check (public.is_course_owner(course_id));

create policy "Admins update recordings"
  on public.course_recordings for update
  using (public.is_course_owner(course_id));

create policy "Admins delete recordings"
  on public.course_recordings for delete
  using (public.is_course_owner(course_id));

-- Students: select-only for enrolled courses
create policy "Students select enrolled course recordings"
  on public.course_recordings for select
  using (public.is_enrolled_in_course(course_id));
