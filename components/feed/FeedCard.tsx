import Link from 'next/link'
import { Star, CalendarCheck } from 'lucide-react'

export interface FeedEntry {
  id: string
  project_type_label: string
  trade_category: string
  cost_range_label: string
  copy_line: string
  completion_date: string
  days_to_complete: number | null
  neighborhood_label: string
  homeowner_opted_in: boolean
  contractor_profiles: {
    id: string
    business_name: string
    subscription_tier: string
    rating: number
    review_count: number
  } | null
}

export function FeedCard({ entry }: { entry: FeedEntry }) {
  const contractor = entry.contractor_profiles
  const completedDate = new Date(entry.completion_date)
  const dateLabel = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      {/* Trade badge + date */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#FF6B35] bg-orange-50 px-2.5 py-1 rounded-full">
          {entry.trade_category}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <CalendarCheck className="w-3.5 h-3.5" />
          {dateLabel}
        </div>
      </div>

      {/* Main copy */}
      <p className="text-sm text-gray-800 leading-relaxed mb-3">{entry.copy_line}</p>

      {/* Cost badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-bold text-gray-900">{entry.cost_range_label}</span>
        {entry.days_to_complete && (
          <span className="text-xs text-gray-400">· {entry.days_to_complete} days</span>
        )}
      </div>

      {/* Contractor attribution */}
      {contractor ? (
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {contractor.business_name?.charAt(0) ?? 'C'}
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900 leading-none">{contractor.business_name}</div>
              {contractor.rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-gray-500">{contractor.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          <Link
            href={`/contractors/${contractor.id}`}
            className="text-xs font-medium text-[#FF6B35] hover:underline"
          >
            View profile
          </Link>
        </div>
      ) : (
        <div className="pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">Completed by a local contractor</span>
        </div>
      )}
    </div>
  )
}
