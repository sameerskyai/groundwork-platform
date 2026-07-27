/**
 * BUG #4 ROOT CAUSE + FIX.
 *
 * FEATURE_INVENTORY.md ("Direct messaging"): "Nothing in the app ever creates a
 * `conversations` row -- inserts exist only in seed files. The inbox can only
 * show seeded demo threads." Verified: app/api/swipes/route.ts:102-128 creates
 * a `matches` row on mutual match and stops there. No INSERT into
 * `conversations` exists anywhere outside supabase/seed*.
 *
 * The structurally correct place for this is app/api/swipes/route.ts, which is
 * outside this pass's file scope. So creation lives here and is called from the
 * dashboard code paths that own the accept action:
 *   - app/(dashboard)/homeowner/page.tsx  -> after /api/swipes reports matched
 *   - app/(dashboard)/homeowner/matches/page.tsx -> when a match is hearted
 *
 * RLS allows this from the browser: `conversations_insert_participants`
 * (028_fix_rls_proper_drop_and_recreate.sql:22) permits an insert where
 * auth.uid() = homeowner_id. No policy or schema change was needed.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface EnsureConversationArgs {
  homeownerId: string
  /** contractor_profiles.id -- conversations.contractor_id references it. */
  contractorId: string
  matchId?: string | null
}

/**
 * Return the id of the conversation between this homeowner and contractor,
 * creating it if this is the first time they have matched.
 *
 * Idempotent: there is no unique constraint on (homeowner_id, contractor_id),
 * so we look before we insert, and we tolerate the race by re-reading on
 * failure rather than surfacing a duplicate as an error.
 */
export async function ensureConversation(
  supabase: SupabaseClient,
  { homeownerId, contractorId, matchId = null }: EnsureConversationArgs
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('homeowner_id', homeownerId)
    .eq('contractor_id', contractorId)
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      homeowner_id: homeownerId,
      contractor_id: contractorId,
      match_id: matchId
    })
    .select('id')
    .single()

  if (!error && created?.id) return created.id

  // Lost a race, or the insert was rejected. Re-read: if a row exists now, the
  // outcome the caller wanted is satisfied either way.
  const { data: retry } = await supabase
    .from('conversations')
    .select('id')
    .eq('homeowner_id', homeownerId)
    .eq('contractor_id', contractorId)
    .limit(1)
    .maybeSingle()

  return retry?.id ?? null
}
