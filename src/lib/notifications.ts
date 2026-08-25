import { createClient } from '@/lib/supabase/client'
import type { AppNotification, NotificationType } from '@/types/database'

interface CreateCourseNotificationParams {
  courseId: string
  title: string
  message: string
  type: NotificationType
  link: string
}

/**
 * Creates notifications for all students enrolled / matching the level of a course.
 * Uses the database RPC `notify_course_students` with a robust fallback to direct client insertion.
 */
export async function createCourseNotification({
  courseId,
  title,
  message,
  type,
  link,
}: CreateCourseNotificationParams): Promise<void> {
  const supabase = createClient()

  try {
    // 1. Try calling the database stored procedure
    const { error: rpcError } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: Error | null }>)(
      'notify_course_students',
      {
        p_course_id: courseId,
        p_title: title,
        p_message: message,
        p_type: type,
        p_link: link,
      }
    )

    if (!rpcError) {
      return
    }

    console.warn('RPC notify_course_students failed or not yet installed, using fallback:', rpcError.message)

    // 2. Fallback: Fetch course level and students manually
    const { data: courseData } = await supabase
      .from('courses')
      .select('level')
      .eq('id', courseId)
      .single<{ level: string }>()

    const courseLevel = courseData?.level

    let studentQuery = supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')

    if (courseLevel) {
      studentQuery = studentQuery.or(`level.eq.${courseLevel},level.is.null`)
    }

    const { data: students, error: studentError } = await studentQuery.returns<{ id: string }[]>()

    if (studentError || !students || students.length === 0) {
      return
    }

    const notificationsToInsert = students.map((student: { id: string }) => ({
      user_id: student.id,
      course_id: courseId,
      title,
      message,
      type,
      link,
      is_read: false,
    }))

    await supabase.from('notifications').insert(notificationsToInsert as never)
  } catch (err) {
    console.error('Error creating course notification:', err)
  }
}

/**
 * Fetch all notifications for a specific user
 */
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.warn('Could not fetch notifications:', error.message)
      return []
    }

    return (data as AppNotification[]) || []
  } catch (err) {
    console.error('Failed to get notifications:', err)
    return []
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient()
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('id', notificationId)
  } catch (err) {
    console.error('Failed to mark notification as read:', err)
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient()
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('user_id', userId)
      .eq('is_read', false)
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err)
  }
}

/**
 * Clear/delete all notifications for a user
 */
export async function clearAllNotifications(userId: string): Promise<void> {
  const supabase = createClient()
  try {
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
  } catch (err) {
    console.error('Failed to clear notifications:', err)
  }
}
