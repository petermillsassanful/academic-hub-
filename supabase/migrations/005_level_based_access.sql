-- ============================================================
-- Phase 5: Level-Based Access
-- Replaces manual enrollment (course_students) with automatic
-- level matching between profiles.level and courses.level
-- ============================================================

-- ── 1. Add new columns ────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS index_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS level text;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level text;

-- ── 2. Backfill courses.level from existing semester values ───
-- Semester values look like "Level 300 — Semester 1"
-- Extract the numeric level part

UPDATE public.courses
SET level = substring(semester from 'Level (\d+)')
WHERE level IS NULL AND semester ~ 'Level \d+';

-- Fallback for any rows that didn't match the pattern
UPDATE public.courses
SET level = '100'
WHERE level IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.courses
  ALTER COLUMN level SET NOT NULL;

-- ── 3. New SECURITY DEFINER function: is_same_level ───────────

CREATE OR REPLACE FUNCTION public.is_same_level(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.courses c ON c.id = p_course_id
    WHERE p.id = auth.uid()
      AND p.role = 'student'
      AND p.level = c.level
  );
$$;

-- ── 4. Drop old enrollment-based policies ─────────────────────

-- courses
DROP POLICY IF EXISTS "Students can select enrolled courses" ON public.courses;

-- course_materials
DROP POLICY IF EXISTS "Students select enrolled course materials" ON public.course_materials;

-- course_recordings
DROP POLICY IF EXISTS "Students select enrolled course recordings" ON public.course_recordings;

-- assignments
DROP POLICY IF EXISTS "Students view enrolled assignments" ON public.assignments;

-- submissions
DROP POLICY IF EXISTS "Students insert submission before deadline" ON public.submissions;

-- course_students (both policies)
DROP POLICY IF EXISTS "Admins can manage enrollments for own courses" ON public.course_students;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.course_students;

-- ── 5. Recreate policies using is_same_level ──────────────────

CREATE POLICY "Students can select level courses"
  ON public.courses FOR SELECT
  USING (public.is_same_level(id));

CREATE POLICY "Students select level course materials"
  ON public.course_materials FOR SELECT
  USING (public.is_same_level(course_id));

CREATE POLICY "Students select level course recordings"
  ON public.course_recordings FOR SELECT
  USING (public.is_same_level(course_id));

CREATE POLICY "Students view level assignments"
  ON public.assignments FOR SELECT
  USING (public.is_same_level(course_id));

CREATE POLICY "Students insert submission before deadline"
  ON public.submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND public.is_same_level(public.get_assignment_course(assignment_id))
    AND (
      SELECT deadline FROM public.assignments WHERE id = assignment_id
    ) > now()
  );

-- ── 6. Drop the course_students table ─────────────────────────

DROP TABLE IF EXISTS public.course_students CASCADE;

-- ── 7. Drop the old enrollment function ───────────────────────

DROP FUNCTION IF EXISTS public.is_enrolled_in_course(uuid);

-- ── 8. Update handle_new_user trigger to include new fields ───

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, index_number, level)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    new.raw_user_meta_data ->> 'index_number',
    new.raw_user_meta_data ->> 'level'
  );
  RETURN new;
END;
$$;
