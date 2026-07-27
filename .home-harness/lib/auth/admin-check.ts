import { createClient } from '@/lib/supabase/server'

/**
 * Verify user is admin
 * @returns { success: true, isAdmin: true } OR { success: true, isAdmin: false } OR { success: false, error }
 */
export async function checkAdminRole() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: true, isAdmin: false }
    }

    // Fetch user's role from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error) {
      return { success: false, error: 'Could not verify role' }
    }

    return { success: true, isAdmin: profile?.role === 'admin' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Throw 403 if user is not admin
 */
export async function requireAdmin() {
  const { success, isAdmin, error } = await checkAdminRole()

  if (!success) {
    throw new Error(error || 'Role check failed')
  }

  if (!isAdmin) {
    const err = new Error('Forbidden')
    ;(err as any).status = 403
    throw err
  }
}
