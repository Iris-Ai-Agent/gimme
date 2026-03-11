import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
    const { data } = await supabase
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
    const enriched = data.map((s) => ({
      ...s,
      payer: (s.payer as unknown as Profile) || { ...fallbackProfile, id: s.payer_id },
      payee: (s.payee as unknown as Profile) || { ...fallbackProfile, id: s.payee_id },
    }))

    setSettlements(enriched)
    setLoading(false)
  }

  async function markSettled(settlementId: string) {
    if (settling) return
    setSettling(settlementId)
    try {
      const { error } = await supabase
        .from('settlements')
        .update({ status: 'settled' as const, settled_at: new Date().toISOString() })
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
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold mb-6">Settle Up</h1>
        <EmptyState
          icon="💰"
          title="Sign in to settle up"
          description="See who owes what from your rounds."
          actionLabel="Sign In"
          onAction={() => navigate('/auth')}
        />
      </div>
    )
  }

  const pending = settlements.filter((s) => s.status === 'pending')
  const settled = settlements.filter((s) => s.status === 'settled')

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold">Settle Up</h1>

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
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pending</h2>
              {pending.map((s) => {
                const isYouPaying = s.payer_id === user.id
                return (
                  <Card key={s.id} variant="elevated">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm">
                        <span className="font-medium">{isYouPaying ? 'You' : s.payer.display_name}</span>
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="font-medium">{isYouPaying ? s.payee.display_name : 'You'}</span>
                      </div>
                      <span className={`font-bold text-lg ${isYouPaying ? 'text-birdie-red' : 'text-masters-green'}`}>
                        ${s.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {isYouPaying && s.payee.venmo_handle && (
                        <a
                          href={generateVenmoLink(s.payee.venmo_handle, s.amount, 'Gimme golf settlement')}
                          className="flex-1 text-center text-sm font-medium py-2 rounded-xl bg-[#008CFF] text-white tap-target"
                        >
                          Pay via Venmo
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => markSettled(s.id)}
                        disabled={settling === s.id}
                      >
                        {settling === s.id ? (
                          <span className="flex items-center gap-2"><Spinner />Settling...</span>
                        ) : 'Mark Settled'}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {settled.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Settled</h2>
              {settled.map((s) => {
                const isYouPaying = s.payer_id === user.id
                return (
                  <Card key={s.id} className="opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{isYouPaying ? 'You' : s.payer.display_name}</span>
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="font-medium">{isYouPaying ? s.payee.display_name : 'You'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">${s.amount.toFixed(2)}</span>
                        <p className="text-xs text-gray-500">
                          {s.settled_at ? new Date(s.settled_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
