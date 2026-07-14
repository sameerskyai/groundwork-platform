import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function client() {
  if (!_client) _client = new Anthropic()
  return _client
}

export interface ProjectData {
  budget_min: number | null
  budget_max: number | null
  zip_code: string
  lat: number | null
  lng: number | null
  trade_id: string
  description: string
  homeowner_preferences?: {
    preferred_budget: number | null
    preferred_timeline: string | null
    preferred_style: string | null
    experience_level_preference: string | null
  }
}

export interface ContractorData {
  business_name: string
  rating: number | null
  trust_score: number | null
  service_radius_miles: number
  zip_code: string
  lat: number | null
  lng: number | null
  verified_job_count: number
  subscription_tier: 'standard' | 'growth'
}

export interface RealtorPortalData {
  working_areas: string[] // e.g. ["Arlington, VA", "Alexandria, VA", "Washington, DC"]
  lat: number | null
  lng: number | null
}

export interface MatchScore {
  match_percentage: number // 0-100
  should_surface: boolean // true if >= 85%
  factors: {
    budget_compatibility: number
    distance_compatibility: number
    experience_compatibility: number
    personality_compatibility: number
  }
  reasoning: string
}

/**
 * Calculate match score between project and contractor
 * Used by homeowner portal
 */
export async function scoreProjectContractorMatch(
  project: ProjectData,
  contractor: ContractorData
): Promise<MatchScore> {
  const budgetMid = project.budget_min && project.budget_max
    ? (project.budget_min + project.budget_max) / 2
    : null

  const distance = calculateDistance(
    project.lat,
    project.lng,
    contractor.lat,
    contractor.lng
  )

  const systemPrompt = `You are a home improvement project matching algorithm. Score the compatibility between a homeowner's project and a contractor's profile on a scale of 0-100, with 85%+ being a strong match.

Consider these factors:
1. Budget compatibility (0-25 points)
   - Does contractor's typical project cost align with homeowner budget?
   - More points = better alignment
2. Distance compatibility (0-25 points)
   - Is contractor within their service radius?
   - More points = closer proximity
3. Experience compatibility (0-25 points)
   - Does contractor's experience match the project type?
   - Trust score, job count, and ratings
4. Personality/Style compatibility (0-25 points)
   - Contractor's approach matches homeowner preferences
   - Communication style, work quality, timeline expectations

Return ONLY valid JSON with this exact structure:
{
  "budget_compatibility": number (0-25),
  "distance_compatibility": number (0-25),
  "experience_compatibility": number (0-25),
  "personality_compatibility": number (0-25),
  "total": number (0-100),
  "reasoning": "string (2-3 sentences explaining the score)"
}`

  const userPrompt = `Project:
- Budget: $${project.budget_min}-$${project.budget_max}
- ZIP Code: ${project.zip_code}
- Description: ${project.description}
- Homeowner preferences: ${JSON.stringify(project.homeowner_preferences || {})}

Contractor:
- Name: ${contractor.business_name}
- Service Radius: ${contractor.service_radius_miles} miles
- ZIP Code: ${contractor.zip_code}
- Distance from project: ${distance?.toFixed(1) || 'unknown'} miles
- Trust Score: ${contractor.trust_score || 'unrated'}
- Verified Jobs: ${contractor.verified_job_count}
- Rating: ${contractor.rating ? contractor.rating.toFixed(1) + '/5' : 'unrated'}
- Subscription: ${contractor.subscription_tier}

Score this match from 0-100. Only score 85+ if it's a strong fit.`

  const response = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Match scorer returned invalid response')

  const result = JSON.parse(jsonMatch[0])

  return {
    match_percentage: result.total,
    should_surface: result.total >= 85,
    factors: {
      budget_compatibility: result.budget_compatibility,
      distance_compatibility: result.distance_compatibility,
      experience_compatibility: result.experience_compatibility,
      personality_compatibility: result.personality_compatibility
    },
    reasoning: result.reasoning
  }
}

/**
 * Calculate match score between project and realtor/PM service area
 */
export async function scoreProjectRealtorMatch(
  project: ProjectData,
  realtorPortal: RealtorPortalData
): Promise<MatchScore> {
  const systemPrompt = `You are matching a home improvement project to a realtor/property manager's service areas.

Score based on:
1. Geographic alignment (0-50 points)
   - Is the project ZIP in one of the realtor's working areas?
   - More points = exact area match vs nearby area
2. Project scale fit (0-30 points)
   - Does project type/scope match realtor's portfolio?
3. Service alignment (0-20 points)
   - Portfolio type (residential/commercial) matches project needs

Return ONLY valid JSON:
{
  "geographic_compatibility": number (0-50),
  "scale_compatibility": number (0-30),
  "service_compatibility": number (0-20),
  "total": number (0-100),
  "reasoning": "string"
}`

  const userPrompt = `Project:
- ZIP Code: ${project.zip_code}
- Description: ${project.description}
- Budget: $${project.budget_min}-$${project.budget_max}

Realtor/PM Service Areas:
${realtorPortal.working_areas.map(a => `- ${a}`).join('\n')}

Score the geographic alignment and project fit. 85+ only if strong match to service area.`

  const response = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Realtor match scorer returned invalid response')

  const result = JSON.parse(jsonMatch[0])

  return {
    match_percentage: result.total,
    should_surface: result.total >= 85,
    factors: {
      budget_compatibility: 0,
      distance_compatibility: result.geographic_compatibility,
      experience_compatibility: result.scale_compatibility,
      personality_compatibility: result.service_compatibility
    },
    reasoning: result.reasoning
  }
}

/**
 * Haversine distance calculation (miles)
 */
function calculateDistance(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null
): number | null {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null

  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
