-- ============================================================
-- Phase 6: Storage Buckets & Policies
--
-- Creates the two missing content buckets and wires up all
-- storage-level RLS so that:
--   • Admins can upload / delete to their course folders
--   • Students can read (download/stream) from those buckets
--   • Admins can read student-submitted files for grading
-- ============================================================

-- ── 1. Create missing buckets ─────────────────────────────────

insert into storage.buckets (id, name, public)
values ('course-materials', 'course-materials', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('course-recordings', 'course-recordings', true)
on conflict (id) do nothing;

-- submissions bucket was created in 004 — ensure it exists
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do nothing;

-- ── 2. course-materials storage policies ──────────────────────

-- Admins can upload files (path starts with courseId they own)
create policy "Admins upload course materials"
  on storage.objects for insert
  with check (
    bucket_id = 'course-materials'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.courses c
      where c.id::text = (storage.foldername(name))[1]
        and c.created_by = auth.uid()
    )
  );

-- Admins can delete files from their courses
create policy "Admins delete course materials"
  on storage.objects for delete
  using (
    bucket_id = 'course-materials'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.courses c
      where c.id::text = (storage.foldername(name))[1]
        and c.created_by = auth.uid()
    )
  );

-- Admins can read their own course files
create policy "Admins read course materials"
  on storage.objects for select
  using (
    bucket_id = 'course-materials'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.courses c
      where c.id::text = (storage.foldername(name))[1]
        and c.created_by = auth.uid()
    )
  );

-- Students can download materials for courses matching their level
create policy "Students read course materials by level"
  on storage.objects for select
  using (
    bucket_id = 'course-materials'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.profiles p
      join public.courses c on c.level = p.level
      where p.id = auth.uid()
        and p.role = 'student'
        and c.id::text = (storage.foldername(name))[1]
    )
  );

-- ── 3. course-recordings storage policies ─────────────────────

create policy "Admins upload course recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'course-recordings'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.courses c
      where c.id::text = (storage.foldername(name))[1]
        and c.created_by = auth.uid()
    )
  );

create policy "Admins delete course recordings"
  on storage.objects for delete
  using (
    bucket_id = 'course-recordings'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.courses c
      where c.id::text = (storage.foldername(name))[1]
        and c.created_by = auth.uid()
    )
  );

create policy "Admins read course recordings"
  on storage.objects for select
  using (
    bucket_id = 'course-recordings'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.courses c
      where c.id::text = (storage.foldername(name))[1]
        and c.created_by = auth.uid()
    )
  );

-- Students can stream/download recordings for courses at their level
create policy "Students read course recordings by level"
  on storage.objects for select
  using (
    bucket_id = 'course-recordings'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.profiles p
      join public.courses c on c.level = p.level
      where p.id = auth.uid()
        and p.role = 'student'
        and c.id::text = (storage.foldername(name))[1]
    )
  );

-- ── 4. submissions storage policies ───────────────────────────

-- Students upload to their own folder
-- Path structure: {student_uuid}/{assignment_uuid}/{timestamp}-{filename}
create policy "Students upload own submissions"
  on storage.objects for insert
  with check (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can read / re-download their own submissions
create policy "Students read own submissions"
  on storage.objects for select
  using (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can overwrite their own file on re-submit (upsert)
create policy "Students update own submission files"
  on storage.objects for update
  using (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all submitted files (needed for grading panel download)
create policy "Admins read student submissions"
  on storage.objects for select
  using (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
