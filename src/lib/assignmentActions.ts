'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveAssignments(
  protocolId: string,
  reviewer1Id: string,
  reviewer2Id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'executive' && profile.role !== 'admin')) {
    return { error: 'Unauthorized' }
  }

  const { error: deleteError } = await supabase
    .from('protocol_assignments')
    .delete()
    .eq('protocol_id', protocolId)

  if (deleteError) {
    console.error('[saveAssignments] delete error:', deleteError)
    return { error: `Delete failed: ${deleteError.message}` }
  }

  const toInsert: { protocol_id: string; reviewer_id: string; assigned_by: string; status: string }[] = []
  if (reviewer1Id) {
    toInsert.push({ protocol_id: protocolId, reviewer_id: reviewer1Id, assigned_by: user.id, status: 'pending' })
  }
  if (reviewer2Id && reviewer2Id !== reviewer1Id) {
    toInsert.push({ protocol_id: protocolId, reviewer_id: reviewer2Id, assigned_by: user.id, status: 'pending' })
  }

  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('protocol_assignments')
      .insert(toInsert)
      .select()
    if (insertError) return { error: `Insert failed: ${insertError.message}` }
    if (!inserted || inserted.length !== toInsert.length) {
      return { error: `Insert silent-failed: expected ${toInsert.length} rows, got ${inserted?.length ?? 0}.` }
    }
  }

  revalidatePath(`/dashboard/executive/protocols/${protocolId}`)
  revalidatePath('/dashboard/executive')
  return {}
}
