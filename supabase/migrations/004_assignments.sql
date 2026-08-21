-- ============================================================
-- Phase 4: Assignments & Submissions
-- ============================================================

-- assignments table
create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  instructions text,
  deadline     timestamptz not null,
  max_score    numeric not null default 100,
  created_at   timestamptz not null default now()
);

-- submissions table
create table if not exists public.submissions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references public.assignments(id) on delete cascade,
  student_id     uuid not null references public.profiles(id) on delete cascade,
  file_url       text,
  written_answer text,
  submitted_at   timestamptz not null default now(),
  grade          numeric,
  feedback       text,
  graded_at      timestamptz,
  unique(assignment_id, student_id)
);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

-- ── Helper SECURITY DEFINER functions ──────────────────────────

-- Check if current user owns the course an assignment belongs to
create or replace function public.is_assignment_owner(p_assignment_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = p_assignment_id
      and c.created_by = auth.uid()
  );
$$;

-- Get the course_id of an assignment (bypasses RLS)
create or replace function public.get_assignment_course(p_assignment_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select course_id from public.assignments where id = p_assignment_id;
$$;

-- ── Assignment policies ─────────────────────────────────────────

create policy "Admins manage own assignments"
  on public.assignments for all
  using (public.is_course_owner(course_id))
  with check (public.is_course_owner(course_id));

create policy "Students view enrolled assignments"
  on public.assignments for select
  using (public.is_enrolled_in_course(course_id));

-- ── Submission policies ─────────────────────────────────────────

-- Students can view their own submissions
create policy "Students view own submissions"
  on public.submissions for select
  using (student_id = auth.uid());

-- Students can submit (INSERT) before deadline, if enrolled
create policy "Students insert submission before deadline"
  on public.submissions for insert
  with check (
    student_id = auth.uid()
    and public.is_enrolled_in_course(public.get_assignment_course(assignment_id))
    and (
      select deadline from public.assignments where id = assignment_id
    ) > now()
  );

-- Students can re-submit (UPDATE) if not yet graded and before deadline
create policy "Students resubmit if not graded"
  on public.submissions for update
  using (
    student_id = auth.uid()
    and grade is null
    and (
      select deadline from public.assignments where id = assignment_id
    ) > now()
  );

-- Admins can view all submissions for their courses
create policy "Admins view submissions for own courses"
  on public.submissions for select
  using (public.is_assignment_owner(assignment_id));

-- Admins can update (grade + feedback) submissions in their courses
create policy "Admins grade submissions"
  on public.submissions for update
  using (public.is_assignment_owner(assignment_id));

-- ── Storage bucket for submissions ─────────────────────────────

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do nothing;

-- Students upload to their own folder only
create policy "Students upload submissions"
  on storage.objects for insert
  with check (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
