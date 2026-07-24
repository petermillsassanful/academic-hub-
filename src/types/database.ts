export type Role = 'admin' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
    }
  }
}
