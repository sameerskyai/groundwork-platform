'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, Wrench, MessageCircle, DollarSign, Send } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalContractors: number
  activeSubscriptions: number
  totalProjects: number
  totalMatches: number
  estimatedMRR: number
  standardTier: number
  growthTier: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    fetch('/api/admin').then(r => r.json()).then(d => setStats(d.stats))
  }, [])

  async function askAgent() {
    if (!question.trim()) return
    setAsking(true)
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    })
    const data = await res.json()
    setAnswer(data.answer)
    setAsking(false)
  }

  if (!stats) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>

  const statCards = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Active subscriptions', value: stats.activeSubscriptions, icon: Wrench, color: 'text-[#FF6B35]' },
    { label: 'Total projects', value: stats.totalProjects, icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Total matches', value: stats.totalMatches, icon: MessageCircle, color: 'text-green-500' },
    { label: 'Estimated MRR', value: formatCurrency(stats.estimatedMRR), icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Growth tier', value: stats.growthTier, icon: TrendingUp, color: 'text-[#FF6B35]' }
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2 max-w-6xl mx-auto">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold">Groundwork Admin</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {statCards.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI admin agent */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-1">Ask the AI analyst</h2>
          <p className="text-sm text-gray-500 mb-4">Ask anything about platform performance.</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') askAgent() }}
              placeholder="e.g. How is the Growth tier performing vs Standard?"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
            <Button size="md" onClick={askAgent} disabled={asking || !question.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {answer && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed">
              {answer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
