import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/stores/auth'
import type { Settlement, Profile } from '@/types/database'
import { generateVenmoLink } from '@/lib/games/settlement'

export function SettlePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [settlements, setSettlements] = useState<(Settlement & { payer: Profile; payee: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  const [settling, setSettling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await fetchSettlements()
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch settlements:', err)
          toast('error', 'Failed to load settlements')
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [user])

  async function fetchSettlements() {
    if (!user) return
    const { data } = await db
      .from('settlements')
      .select('*, payer:profiles!payer_id(id, display_name, avatar_url, venmo_handle, cashapp_handle), payee:profiles!payee_id(id, display_name, avatar_url, venmo_handle, cashapp_handle)')
      .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!data || data.length === 0) {
      setSettlements([])
      setLoading(false)
      return
    }

    const fallbackProfile = { id: '', display_name: 'Unknown', avatar_url: null, venmo_handle: null, cashapp_handle: null }
    const enriched = (data as any[]).map((s: any) => ({
      ...s,
      payer: s.payer || { ...fallbackProfile, id: s.payer_id },
      payee: s.payee || { ...fallbackProfile, id: s.payee_id },
    }))

    setSettlements(enriched)
    setLoading(false)
  }

  async function markSettled(settlementId: string) {
    if (settling) return
    setSettling(settlementId)
    try {
      const { error } = await db
        .from('settlements')
        .update({ status: 'settled', settled_at: new Date().toISOString() })
        .eq('id', settlementId)

      if (error) {
        toast('error', 'Failed to mark as settled')
        return
      }
      toast('success', 'Marked as settled!')
      await fetchSettlements()
    } catch {
      toast('error', 'Failed to mark as settled')
    } finally {
      setSettling(null)
    }
  }

  if (loading) return <PageSkeleton />

  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="w-full px-4 py-4" style={{ backgroundColor: '#2D4A3E' }}>
          <h1 className="text-lg font-bold text-[#F5F0E8]">Settle Up</h1>
        </div>
        <div className="px-4 pt-6 max-w-lg mx-auto">
          <EmptyState
            icon="💰"
            title="Sign in to settle up"
            description="See who owes what from your rounds."
            actionLabel="Sign In"
            onAction={() => navigate('/auth')}
          />
        </div>
      </div>
    )
  }

  const pending = settlements.filter((s) => s.status === 'pending')
  const settled = settlements.filter((s) => s.status === 'settled')

  return (
    <div className="min-h-dvh flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header bar */}
      <div className="w-full px-4 py-4" style={{ backgroundColor: '#2D4A3E' }}>
        <h1 className="text-lg font-bold text-[#F5F0E8]">Settle Up</h1>
      </div>

      <div className="px-4 pt-4 pb-4 max-w-lg mx-auto w-full space-y-6">
        {settlements.length === 0 ? (
          <EmptyState
            icon="💰"
            title="Nothing to settle"
            description="Complete a round with side games to see settlements here."
            actionLabel="Start a Round"
            onAction={() => navigate('/round/new')}
          />
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#2D4A3E' }}>Pending</h2>
                {pending.map((s) => {
                  const isYouPaying = s.payer_id === user.id
                  return (
                    <div key={s.id} className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#2D4A3E10' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm" style={{ color: '#2D4A3E' }}>
                          <span className="font-medium">{isYouPaying ? 'You' : s.payer.display_name}</span>
                          <span className="mx-2" style={{ opacity: 0.4 }}>→</span>
                          <span className="font-medium">{isYouPaying ? s.payee.display_name : 'You'}</span>
                        </div>
                        <span className="font-bold text-lg" style={{ color: isYouPaying ? '#dc2626' : '#2D4A3E' }}>
                          ${s.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {isYouPaying && s.payee.venmo_handle && (
                          <a
                            href={generateVenmoLink(s.payee.venmo_handle, s.amount, 'Bogey Bookie golf settlement')}
                            className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl tap-target"
                            style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
                          >
                            Pay via Venmo
                          </a>
                        )}
                        <button
                          className="flex-1 text-center text-sm font-medium py-2.5 rounded-xl border-2 tap-target transition-all active:scale-[0.98]"
                          style={{ borderColor: '#2D4A3E', color: '#2D4A3E' }}
                          onClick={() => markSettled(s.id)}
                          disabled={settling === s.id}
                        >
                          {settling === s.id ? (
                            <span className="flex items-center justify-center gap-2"><Spinner />Settling...</span>
                          ) : 'Mark Settled'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {settled.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#2D4A3E' }}>Settled</h2>
                {settled.map((s) => {
                  const isYouPaying = s.payer_id === user.id
                  return (
                    <div key={s.id} className="bg-white rounded-2xl p-4 border opacity-60" style={{ borderColor: '#2D4A3E10' }}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm" style={{ color: '#2D4A3E' }}>
                          <span className="font-medium">{isYouPaying ? 'You' : s.payer.display_name}</span>
                          <span className="mx-2" style={{ opacity: 0.4 }}>→</span>
                          <span className="font-medium">{isYouPaying ? s.payee.display_name : 'You'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold" style={{ color: '#2D4A3E' }}>${s.amount.toFixed(2)}</span>
                          <p className="text-xs" style={{ color: '#2D4A3E', opacity: 0.5 }}>
                            {s.settled_at ? new Date(s.settled_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
