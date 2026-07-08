import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Star, Shield, Clock, MapPin, Wrench } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ContractorPublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contractor } = await supabase
    .from('contractor_profiles')
    .select(`
      *,
      profiles(full_name, zip_code),
      contractor_trades(trades(name, slug))
    `)
    .eq('id', id)
    .eq('active', true)
    .single()

  if (!contractor) notFound()

  const profile = contractor.profiles as any
  const trades = contractor.contractor_trades?.map((ct: any) => ct.trades).filter(Boolean) ?? []

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Groundwork</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center flex-shrink-0">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{contractor.business_name}</h1>
                {contractor.subscription_tier === 'growth' && (
                  <span className="text-xs bg-[#FF6B35] text-white px-2 py-0.5 rounded-full font-medium">Featured</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                {contractor.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {contractor.rating.toFixed(1)} ({contractor.review_count} reviews)
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile?.zip_code}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Years exp.', value: contractor.years_in_business ?? '—', icon: Clock },
              { label: 'Response rate', value: `${contractor.response_rate ?? 100}%`, icon: Clock },
              { label: 'Service radius', value: `${contractor.service_radius_miles ?? 25}mi`, icon: MapPin }
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Credentials */}
          <div className="flex gap-3 mb-5">
            {contractor.insured && (
              <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-medium">
                <Shield className="w-4 h-4" /> Insured
              </span>
            )}
            {contractor.bonded && (
              <span className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium">
                <Shield className="w-4 h-4" /> Bonded
              </span>
            )}
            {contractor.license_number && (
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                Lic. {contractor.license_number}
              </span>
            )}
          </div>

          {/* Bio */}
          {contractor.bio && (
            <div className="mb-5">
              <h2 className="text-sm font-bold text-gray-700 mb-2">About</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{contractor.bio}</p>
            </div>
          )}

          {/* Trades */}
          {trades.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-2">Trades</h2>
              <div className="flex flex-wrap gap-2">
                {trades.map((t: any) => (
                  <span key={t.slug} className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{t.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link href="/signup?role=homeowner">
          <Button size="lg" className="w-full">
            Get a quote from {contractor.business_name?.split(' ')[0]}
          </Button>
        </Link>
      </div>
    </div>
  )
}
