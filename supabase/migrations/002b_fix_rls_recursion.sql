-- ============================================================
-- Fix: Infinite recursion in courses/course_students RLS policies
--
-- Root cause:
--   "Students can select enrolled courses" on courses → queries course_students
--   "Admins can manage enrollments" on course_students → queries courses
--   → infinite loop
--
-- Fix: Use SECURITY DEFINER functions that bypass RLS for the sub-lookups
-- ============================================================

-- 1. Drop the circular policies
DROP POLICY IF EXISTS "Students can select enrolled courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage enrollments for own courses" ON public.course_students;

-- 2. Helper: check if current user is enrolled in a course (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_students
    WHERE course_id = p_course_id
      AND student_id = auth.uid()
  );
$$;

-- 3. Helper: check if current user owns a course (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_course_owner(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = p_course_id
      AND created_by = auth.uid()
  );
$$;

-- 4. Recreate the student courses policy using the definer function
CREATE POLICY "Students can select enrolled courses"
  ON public.courses FOR SELECT
  USING (public.is_enrolled_in_course(id));

-- 5. Recreate the enrollment management policy using the definer function
CREATE POLICY "Admins can manage enrollments for own courses"
  ON public.course_students FOR ALL
  USING (public.is_course_owner(course_id));
