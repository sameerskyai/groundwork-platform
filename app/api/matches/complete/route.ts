import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/matches/complete
// Homeowner submits a review for a completed match
// Creates: completed_jobs row, reviews row, updates contractor trust scores
// Body: { matchId, projectId, rating, finalPrice, onTime?, hasDispute }
export async function POST(req: NextRequest) {
  try {
    const { matchId, projectId, rating, finalPrice, onTime, hasDispute } = await req.json()

    if (!matchId || !projectId || !rating || finalPrice === undefined) {
      return NextResponse.json(
        { error: 'matchId, projectId, rating, and finalPrice required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load the match — verify homeowner ownership via project
    const { data: match } = await supabase
      .from('matches')
      .select(`
        *,
        projects(user_id, zip_code, trade_id),
        contractor_profiles(id)
      `)
      .eq('id', matchId)
      .eq('project_id', projectId)
      .eq('status', 'matched')
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match not found or not in matched status' }, { status: 404 })
    }

    const project = match.projects as any
    if (project?.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to review this match' }, { status: 403 })
    }

    const contractorId = match.contractor_id
    const adminClient = await createAdminClient()

    // Check if already reviewed (duplicate prevention)
    const { data: existingReview } = await adminClient
      .from('reviews')
      .select('id')
      .eq('match_id', matchId)
      .maybeSingle()

    if (existingReview) {
      return NextResponse.json({ error: 'This match has already been reviewed' }, { status: 409 })
    }

    // Create completed_jobs row
    const { data: completedJob, error: completedJobError } = await adminClient
      .from('completed_jobs')
      .insert({
        match_id: matchId,
        final_cost: finalPrice,
        duration_days: null, // Could be calculated from project dates if available
        receipt_url: null,
        verified: true // Trust the homeowner's input for now
      })
      .select()
      .single()

    if (completedJobError) {
      console.error('Error creating completed_jobs row:', completedJobError)
      return NextResponse.json({ error: 'Failed to create job record' }, { status: 500 })
    }

    // Create reviews row
    const { data: review, error: reviewError } = await adminClient
      .from('reviews')
      .insert({
        match_id: matchId,
        contractor_id: contractorId,
        reviewer_id: user.id,
        rating,
        final_price: finalPrice,
        on_time: onTime ?? null,
        dispute_flagged: hasDispute || false
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Error creating reviews row:', reviewError)
      return NextResponse.json({ error: 'Failed to create review record' }, { status: 500 })
    }

    // Update contractor trust scores
    // For now, simple calculation: average rating + on-time percentage + dispute-free percentage
    const { data: existingReviews } = await adminClient
      .from('reviews')
      .select('rating, on_time, dispute_flagged')
      .eq('contractor_id', contractorId)

    // `existingReviews` is read back AFTER the insert above, so it already
    // contains the new row. Appending `review` again double-counted it in
    // every average and in verified_job_count.
    const allReviews = existingReviews?.length ? existingReviews : [review]

    // trust_* is stored as an integer 0-50 (0-5 stars x 10).
    const meanStars = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    const trustScore = Math.round(meanStars * 10)

    const onTimeCount = allReviews.filter(r => r.on_time === true).length
    const onTimePercentage = Math.round((onTimeCount / allReviews.length) * 100)

    const disputeFreeCount = allReviews.filter(r => !r.dispute_flagged).length
    const disputeFreePercentage = Math.round((disputeFreeCount / allReviews.length) * 100)

    // contractor_profiles.rating / review_count were never written by this
    // route -- only trust_* was. Both columns default to 0, so every star
    // rating in the product rendered "0.0 (0 reviews)" no matter how many
    // real reviews existed. rating is DECIMAL(3,2) on the 0-5 star scale;
    // trust_score is the 0-50 integer. They are different scales on purpose,
    // and writing the trust value into `rating` would render as "50.0 stars".
    const { error: aggregateError } = await adminClient
      .from('contractor_profiles')
      .update({
        rating: Math.round(meanStars * 100) / 100,
        review_count: allReviews.length,
        trust_score: trustScore,
        trust_accuracy: trustScore, // Using rating as accuracy proxy
        trust_on_time: onTimePercentage,
        trust_dispute_free: disputeFreePercentage,
        verified_job_count: allReviews.length
      })
      .eq('id', contractorId)

    if (aggregateError) {
      // The review is already written and is the source of truth; a failed
      // rollup must be visible in logs rather than silently leaving the
      // profile showing a stale star rating.
      console.error('Error updating contractor rating aggregates:', aggregateError)
    }

    return NextResponse.json({
      success: true,
      matchId,
      review: review,
      completedJob: completedJob
    })
  } catch (err) {
    console.error('Review submission error:', err)
    return NextResponse.json({ error: 'Review submission failed' }, { status: 500 })
  }
}
