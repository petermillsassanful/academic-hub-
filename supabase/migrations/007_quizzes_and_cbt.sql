-- ============================================================
-- Phase 7: Timed Quizzes & Computer-Based Testing (CBT)
-- Idempotent Migration with Question Bank & Randomization
-- ============================================================

-- ── 1. Quizzes Table ─────────────────────────────────────────
create table if not exists public.quizzes (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid not null references public.courses(id) on delete cascade,
  title               text not null,
  description         text,
  duration_minutes    integer not null default 15,
  passing_score       numeric not null default 50, -- Percentage (e.g. 50%)
  questions_to_answer integer,                     -- e.g. Pick 10 random questions from pool of 30 (NULL = all questions)
  shuffle_questions   boolean not null default true, -- Shuffle question order per student
  shuffle_options     boolean not null default true, -- Shuffle A/B/C/D option order per student
  due_date            timestamptz,
  is_published        boolean not null default false,
  created_at          timestamptz not null default now()
);

-- Ensure newly added columns exist if table was already created
alter table public.quizzes
  add column if not exists questions_to_answer integer,
  add column if not exists shuffle_questions boolean not null default true,
  add column if not exists shuffle_options boolean not null default true;

-- ── 2. Quiz Questions Table (Question Bank / Pool) ───────────
create table if not exists public.quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references public.quizzes(id) on delete cascade,
  question_text  text not null,
  question_type  text not null default 'multiple_choice', -- 'multiple_choice' | 'true_false'
  points         numeric not null default 1,
  options        jsonb not null default '[]'::jsonb, -- e.g. ["Option A", "Option B", "Option C", "Option D"]
  correct_answer text not null,                      -- e.g. "Option A"
  order_index    integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ── 3. Quiz Attempts Table ───────────────────────────────────
create table if not exists public.quiz_attempts (
  id                   uuid primary key default gen_random_uuid(),
  quiz_id              uuid not null references public.quizzes(id) on delete cascade,
  student_id           uuid not null references public.profiles(id) on delete cascade,
  assigned_question_ids jsonb not null default '[]'::jsonb, -- Randomized ordered question IDs for THIS student
  started_at           timestamptz not null default now(),
  submitted_at         timestamptz,
  score                numeric,
  total_points         numeric,
  percentage           numeric,
  passed               boolean,
  status               text not null default 'in_progress', -- 'in_progress' | 'completed' | 'timed_out'
  unique(quiz_id, student_id)
);

-- Ensure assigned_question_ids exists if table was already created
alter table public.quiz_attempts
  add column if not exists assigned_question_ids jsonb not null default '[]'::jsonb;

-- ── 4. Quiz Answers Table ────────────────────────────────────
create table if not exists public.quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id     uuid not null references public.quiz_questions(id) on delete cascade,
  selected_answer text,
  is_correct      boolean not null default false,
  points_awarded  numeric not null default 0,
  created_at      timestamptz not null default now(),
  unique(attempt_id, question_id)
);

-- ── 5. Enable RLS ────────────────────────────────────────────
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

-- ── 6. Helper Functions ──────────────────────────────────────

create or replace function public.is_quiz_owner(p_quiz_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.quizzes q
    join public.courses c on c.id = q.course_id
    where q.id = p_quiz_id
      and c.created_by = auth.uid()
  );
$$;

create or replace function public.get_quiz_course(p_quiz_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select course_id from public.quizzes where id = p_quiz_id;
$$;

-- ── 7. RLS Policies: Quizzes ─────────────────────────────────

drop policy if exists "Admins manage own quizzes" on public.quizzes;
create policy "Admins manage own quizzes"
  on public.quizzes for all
  using (public.is_course_owner(course_id))
  with check (public.is_course_owner(course_id));

drop policy if exists "Students view published level quizzes" on public.quizzes;
create policy "Students view published level quizzes"
  on public.quizzes for select
  using (
    public.is_same_level(course_id)
    and is_published = true
  );

-- ── 8. RLS Policies: Quiz Questions ──────────────────────────

drop policy if exists "Admins manage own quiz questions" on public.quiz_questions;
create policy "Admins manage own quiz questions"
  on public.quiz_questions for all
  using (public.is_quiz_owner(quiz_id))
  with check (public.is_quiz_owner(quiz_id));

drop policy if exists "Students view level quiz questions" on public.quiz_questions;
create policy "Students view level quiz questions"
  on public.quiz_questions for select
  using (
    public.is_same_level(public.get_quiz_course(quiz_id))
  );

-- ── 9. RLS Policies: Quiz Attempts ───────────────────────────

drop policy if exists "Students view own quiz attempts" on public.quiz_attempts;
create policy "Students view own quiz attempts"
  on public.quiz_attempts for select
  using (student_id = auth.uid());

drop policy if exists "Students start quiz attempt" on public.quiz_attempts;
create policy "Students start quiz attempt"
  on public.quiz_attempts for insert
  with check (
    student_id = auth.uid()
    and public.is_same_level(public.get_quiz_course(quiz_id))
  );

drop policy if exists "Students update own in-progress attempt" on public.quiz_attempts;
create policy "Students update own in-progress attempt"
  on public.quiz_attempts for update
  using (student_id = auth.uid());

drop policy if exists "Admins view course quiz attempts" on public.quiz_attempts;
create policy "Admins view course quiz attempts"
  on public.quiz_attempts for select
  using (public.is_quiz_owner(quiz_id));

-- ── 10. RLS Policies: Quiz Answers ───────────────────────────

drop policy if exists "Students insert own quiz answers" on public.quiz_answers;
create policy "Students insert own quiz answers"
  on public.quiz_answers for insert
  with check (
    exists (
      select 1 from public.quiz_attempts
      where id = attempt_id and student_id = auth.uid()
    )
  );

drop policy if exists "Students view own quiz answers" on public.quiz_answers;
create policy "Students view own quiz answers"
  on public.quiz_answers for select
  using (
    exists (
      select 1 from public.quiz_attempts
      where id = attempt_id and student_id = auth.uid()
    )
  );

drop policy if exists "Students update own quiz answers" on public.quiz_answers;
create policy "Students update own quiz answers"
  on public.quiz_answers for update
  using (
    exists (
      select 1 from public.quiz_attempts
      where id = attempt_id and student_id = auth.uid()
    )
  );

drop policy if exists "Admins view quiz answers" on public.quiz_answers;
create policy "Admins view quiz answers"
  on public.quiz_answers for select
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and public.is_quiz_owner(a.quiz_id)
    )
  );
