export type Role = 'admin' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  index_number: string | null
  level: string | null
  created_at: string
}

export interface Course {
  id: string
  name: string
  code: string
  description: string | null
  semester: string
  level: string
  created_by: string
  created_at: string
}

export interface CourseMaterial {
  id: string
  course_id: string
  title: string
  description: string | null
  file_url: string
  file_type: string
  file_size: number
  week_number: number
  uploaded_at: string
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  instructions: string | null
  deadline: string
  max_score: number
  created_at: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string | null
  written_answer: string | null
  submitted_at: string
  grade: number | null
  feedback: string | null
  graded_at: string | null
}

export interface CourseRecording {
  id: string
  course_id: string
  title: string
  file_url: string
  file_type: string
  file_size: number
  week_number: number
  uploaded_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: Role
          index_number?: string | null
          level?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: Role
          index_number?: string | null
          level?: string | null
          created_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: Course
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          semester: string
          level: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          semester?: string
          level?: string
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'courses_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      course_materials: {
        Row: CourseMaterial
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          file_url: string
          file_type: string
          file_size?: number
          week_number?: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: string
          file_size?: number
          week_number?: number
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_materials_course_id_fkey'
            columns: ['course_id']
            referencedRelation: 'courses'
            referencedColumns: ['id']
          }
        ]
      }
      course_recordings: {
        Row: CourseRecording
        Insert: {
          id?: string
          course_id: string
          title: string
          file_url: string
          file_type: string
          file_size?: number
          week_number?: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          file_url?: string
          file_type?: string
          file_size?: number
          week_number?: number
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_recordings_course_id_fkey'
            columns: ['course_id']
            referencedRelation: 'courses'
            referencedColumns: ['id']
          }
        ]
      }
      assignments: {
        Row: Assignment
        Insert: {
          id?: string
          course_id: string
          title: string
          instructions?: string | null
          deadline: string
          max_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          instructions?: string | null
          deadline?: string
          max_score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'assignments_course_id_fkey'
            columns: ['course_id']
            referencedRelation: 'courses'
            referencedColumns: ['id']
          }
        ]
      }
      submissions: {
        Row: Submission
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          file_url?: string | null
          written_answer?: string | null
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          file_url?: string | null
          written_answer?: string | null
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'submissions_assignment_id_fkey'
            columns: ['assignment_id']
            referencedRelation: 'assignments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'submissions_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      role: Role
    }
    CompositeTypes: Record<string, never>
  }
}
