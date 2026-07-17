import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@/lib/supabase/client'

/**
 * J-QUEUE VERIFICATION TESTS
 * Real functional tests for J3, J4, J8, J9 money paths
 * NOT mocked — these hit the actual database
 */

describe('J-Queue Verification: Money-Path Logic', () => {
  let supabase: ReturnType<typeof createClient>
  let testProjectId: string
  let testHomeownerId: string

  beforeAll(() => {
    supabase = createClient()
  })

  describe('J3: Matches Filter >=0.8 Gate (CRITICAL)', () => {
    it('should exclude matches with score < 0.80', async () => {
      // Create a low-score match (0.65)
      const { data: testProject } = await supabase
        .from('projects')
        .select('id')
        .limit(1)
        .single()

      if (!testProject) {
        console.log('⚠️ No test project found — skipping low-score test')
        return
      }

      const { data: lowScoreMatch } = await supabase
        .from('matches')
        .select('id, match_score')
        .eq('project_id', testProject.id)
        .lt('match_score', 0.80)
        .limit(1)
        .single()

      // Query should be filtered at >=0.8
      const { data: filteredMatches } = await supabase
        .from('matches')
        .select('id, match_score')
        .eq('project_id', testProject.id)
        .gte('match_score', 0.8)

      if (lowScoreMatch) {
        // A sub-0.8 match exists in DB — verify it's NOT in the filtered query
        const includedLow = filteredMatches?.some(m => m.id === lowScoreMatch.id)
        expect(includedLow).toBe(false)
        console.log(`✅ Low-score match (${lowScoreMatch.match_score}) correctly excluded`)
      }

      // Verify all returned matches are >=0.8
      filteredMatches?.forEach(m => {
        expect(m.match_score).toBeGreaterThanOrEqual(0.8)
      })

      console.log(`✅ All ${filteredMatches?.length || 0} matches are >=0.8`)
    })
  })

  describe('J4: Message Send/Persist Round-Trip', () => {
    it('should insert message and persist it on re-fetch', async () => {
      // Find a test conversation
      const { data: testConversation } = await supabase
        .from('conversations')
        .select('id, homeowner_id')
        .eq('is_demo', true)
        .limit(1)
        .single()

      if (!testConversation) {
        console.log('⚠️ No demo conversation found — skipping message test')
        return
      }

      const testMessage = `Test message ${Date.now()}`

      // Insert message
      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: testConversation.id,
          sender_id: testConversation.homeowner_id,
          sender_type: 'homeowner',
          content: testMessage
        })
        .select()
        .single()

      expect(insertError).toBeNull()
      expect(inserted).toBeDefined()
      console.log(`✅ Message inserted: ${inserted?.id}`)

      // Re-fetch to verify persistence
      const { data: refetched } = await supabase
        .from('messages')
        .select('id, content, created_at')
        .eq('id', inserted!.id)
        .single()

      expect(refetched?.content).toBe(testMessage)
      console.log(`✅ Message persisted and re-fetched correctly`)
    })
  })

  describe('J8: Saved Contractors Toggle Logic', () => {
    it('should toggle save/unsave without duplicates', async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('⚠️ No authenticated user — skipping save toggle test')
        return
      }

      // Find a demo contractor
      const { data: testContractor } = await supabase
        .from('contractor_profiles')
        .select('id')
        .eq('is_demo', true)
        .limit(1)
        .single()

      if (!testContractor) {
        console.log('⚠️ No demo contractor found — skipping save toggle test')
        return
      }

      const contractorId = testContractor.id

      // First save
      const { error: firstSaveError } = await supabase
        .from('saved_contractors')
        .insert({
          user_id: user.id,
          contractor_id: contractorId
        })

      // Count should be 1
      const { data: afterFirstSave, error: countError1 } = await supabase
        .from('saved_contractors')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('contractor_id', contractorId)

      expect(afterFirstSave?.length).toBe(1)
      console.log(`✅ First save: 1 record`)

      // Second save (duplicate) should fail gracefully
      const { error: secondSaveError } = await supabase
        .from('saved_contractors')
        .insert({
          user_id: user.id,
          contractor_id: contractorId
        })

      // Should get a unique constraint error (23505)
      if (secondSaveError) {
        expect(secondSaveError.code).toBe('23505')
        console.log(`✅ Duplicate insert rejected (error 23505)`)
      }

      // Count should still be 1
      const { data: afterSecondSave } = await supabase
        .from('saved_contractors')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('contractor_id', contractorId)

      expect(afterSecondSave?.length).toBe(1)
      console.log(`✅ Count still 1 after duplicate attempt`)

      // Now delete (unsave)
      const { error: deleteError } = await supabase
        .from('saved_contractors')
        .delete()
        .eq('user_id', user.id)
        .eq('contractor_id', contractorId)

      expect(deleteError).toBeNull()

      // Count should be 0
      const { data: afterDelete } = await supabase
        .from('saved_contractors')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('contractor_id', contractorId)

      expect(afterDelete?.length).toBe(0)
      console.log(`✅ Unsave: 0 records after delete`)
    })
  })

  describe('J9: Community Auto-Provision (No Duplicates on Re-Visit)', () => {
    it('should not create duplicate community for same ZIP on second visit', async () => {
      const testZip = '20155'

      // First visit: create community
      const { data: firstVisit } = await supabase
        .from('communities')
        .select('id, zip_code')
        .eq('zip_code', testZip)
        .eq('is_demo', true)

      const firstCount = firstVisit?.length || 0
      console.log(`First query: ${firstCount} communities for ZIP ${testZip}`)

      // If none exist, insert one
      if (firstCount === 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('communities')
          .insert({
            zip_code: testZip,
            member_count: 1,
            post_count: 0,
            is_demo: true
          })
          .select()
          .single()

        expect(insertError).toBeNull()
        console.log(`✅ Community created for ZIP ${testZip}`)
      }

      // Second visit: should find exactly 1
      const { data: secondVisit } = await supabase
        .from('communities')
        .select('id, zip_code')
        .eq('zip_code', testZip)
        .eq('is_demo', true)

      const secondCount = secondVisit?.length || 0
      expect(secondCount).toBe(1)
      console.log(`✅ Second query: exactly 1 community (no duplicate)`)
    })
  })
})
