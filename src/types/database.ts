export type Role = 'admin' | 'student'

export type NotificationType = 'material' | 'assignment' | 'quiz' | 'recording' | 'grade' | 'general'

export interface AppNotification {
  id: string
  user_id: string
  course_id: string | null
  title: string
  message: string
  type: NotificationType
  link: string
  is_read: boolean
  created_at: string
}

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

export interface Quiz {
  id: string
  course_id: string
  title: string
  description: string | null
  duration_minutes: number
  passing_score: number
  questions_to_answer: number | null
  shuffle_questions: boolean
  shuffle_options: boolean
  due_date: string | null
  is_published: boolean
  created_at: string
}

export type QuestionType = 'multiple_choice' | 'true_false'

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_type: QuestionType
  points: number
  options: string[]
  correct_answer: string
  order_index: number
  created_at: string
}

export type AttemptStatus = 'in_progress' | 'completed' | 'timed_out'

export interface QuizAttempt {
  id: string
  quiz_id: string
  student_id: string
  assigned_question_ids?: string[]
  started_at: string
  submitted_at: string | null
  score: number | null
  total_points: number | null
  percentage: number | null
  passed: boolean | null
  status?: AttemptStatus
  answers?: Record<string, string> | null
}

export interface QuizAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_answer: string | null
  is_correct: boolean
  points_awarded: number
  created_at: string
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
      quizzes: {
        Row: Quiz
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          duration_minutes?: number
          passing_score?: number
          questions_to_answer?: number | null
          shuffle_questions?: boolean
          shuffle_options?: boolean
          due_date?: string | null
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          duration_minutes?: number
          passing_score?: number
          questions_to_answer?: number | null
          shuffle_questions?: boolean
          shuffle_options?: boolean
          due_date?: string | null
          is_published?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quizzes_course_id_fkey'
            columns: ['course_id']
            referencedRelation: 'courses'
            referencedColumns: ['id']
          }
        ]
      }
      quiz_questions: {
        Row: QuizQuestion
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type?: QuestionType
          points?: number
          options?: string[]
          correct_answer: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?: QuestionType
          points?: number
          options?: string[]
          correct_answer?: string
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_questions_quiz_id_fkey'
            columns: ['quiz_id']
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          }
        ]
      }
      quiz_attempts: {
        Row: QuizAttempt
        Insert: {
          id?: string
          quiz_id: string
          student_id: string
          assigned_question_ids?: string[]
          started_at?: string
          submitted_at?: string | null
          score?: number | null
          total_points?: number | null
          percentage?: number | null
          passed?: boolean | null
          status?: AttemptStatus
        }
        Update: {
          id?: string
          quiz_id?: string
          student_id?: string
          assigned_question_ids?: string[]
          started_at?: string
          submitted_at?: string | null
          score?: number | null
          total_points?: number | null
          percentage?: number | null
          passed?: boolean | null
          status?: AttemptStatus
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_quiz_id_fkey'
            columns: ['quiz_id']
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quiz_attempts_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      quiz_answers: {
        Row: QuizAnswer
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_answer?: string | null
          is_correct?: boolean
          points_awarded?: number
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_answer?: string | null
          is_correct?: boolean
          points_awarded?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_answers_attempt_id_fkey'
            columns: ['attempt_id']
            referencedRelation: 'quiz_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quiz_answers_question_id_fkey'
            columns: ['question_id']
            referencedRelation: 'quiz_questions'
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
