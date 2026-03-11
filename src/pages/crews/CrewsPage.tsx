import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { shareInvite } from '@/lib/share'
import { getErrorMessage } from '@/lib/utils'
import { useAuth } from '@/stores/auth'
import type { Crew, Profile } from '@/types/database'

interface CrewWithMembers extends Crew {
  memberCount: number
  members: Profile[]
}

export function CrewsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [crews, setCrews] = useState<CrewWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [crewName, setCrewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const crewNameError = crewName.length > 0 && crewName.trim().length === 0
    ? 'Crew name cannot be blank'
    : crewName.trim().length > 50
      ? 'Crew name must be 50 characters or less'
      : ''

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchCrews()
  }, [user])

  async function fetchCrews() {
    if (!user) return
    try {
      const { data: memberRows } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('profile_id', user.id)

      if (!memberRows || memberRows.length === 0) {
        setCrews([])
        setLoading(false)
        return
      }

      const crewIds = memberRows.map((r) => r.crew_id)

      // Fetch all members first to get profile IDs
      const { data: allMembers } = await supabase
        .from('crew_members')
        .select('crew_id, profile_id')
        .in('crew_id', crewIds)

      // Now fetch crews and profiles in parallel (both independent once we have IDs)
      const allProfileIds = [...new Set((allMembers || []).map((m) => m.profile_id))]
      const [{ data: crewData }, { data: profiles }] = await Promise.all([
        supabase.from('crews').select('*').in('id', crewIds),
        allProfileIds.length > 0
          ? supabase.from('profiles').select('*').in('id', allProfileIds)
          : Promise.resolve({ data: [] as Profile[] }),
      ])

      const profileMap = new Map<string, Profile>()
      for (const p of profiles || []) {
        profileMap.set(p.id, p)
      }

      // Group members by crew in-memory
      const membersByCrewId = new Map<string, string[]>()
      for (const m of allMembers || []) {
        const list = membersByCrewId.get(m.crew_id) || []
        list.push(m.profile_id)
        membersByCrewId.set(m.crew_id, list)
      }

      const result: CrewWithMembers[] = (crewData || []).map((crew) => {
        const profileIds = membersByCrewId.get(crew.id) || []
        const profiles = profileIds.map((id) => profileMap.get(id)).filter((p): p is Profile => !!p)
        return { ...crew, memberCount: profileIds.length, members: profiles }
      })

      setCrews(result)
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to load crews'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCrew() {
    if (!user || !crewName.trim()) return
    setSubmitting(true)
    setCreateLoading(true)
    try {
      const { data: crew, error } = await supabase
        .from('crews')
        .insert({ name: crewName.trim(), created_by: user.id })
        .select()
        .single()
      if (error || !crew) throw new Error(error?.message || 'Failed to create crew')

      // Add creator as member
      await supabase.from('crew_members').insert({ crew_id: crew.id, profile_id: user.id })

      toast('success', `Crew "${crew.name}" created!`)
      setCrewName('')
      setShowCreate(false)
      await fetchCrews()
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to create crew'))
    } finally {
      setSubmitting(false)
      setCreateLoading(false)
    }
  }

  async function handleJoinCrew() {
    if (!user || !joinCode.trim()) return
    setSubmitting(true)
    setJoinLoading(true)
    try {
      const { data: crewId, error: rpcErr } = await supabase
        .rpc('join_crew_by_invite_code', { code: joinCode.trim().toLowerCase() })
      if (rpcErr) {
        if (rpcErr.message.includes('duplicate')) {
          toast('info', 'You are already in this crew!')
        } else {
          throw new Error(rpcErr.message)
        }
      } else if (crewId) {
        toast('success', 'Joined crew!')
      }

      setJoinCode('')
      setShowJoin(false)
      await fetchCrews()
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to join crew'))
    } finally {
      setSubmitting(false)
      setJoinLoading(false)
    }
  }

  if (loading) return <PageSkeleton />

  if (!user) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold mb-6">Crews</h1>
        <EmptyState
          icon="👥"
          title="Sign in to manage crews"
          description="Create or join a crew to play regularly with friends."
          actionLabel="Sign In"
          onAction={() => navigate('/auth')}
        />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Crews</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false) }}
            className="text-sm font-medium text-masters-green tap-target px-2"
          >
            Join
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false) }}
            className="text-sm font-medium text-masters-green tap-target px-2"
          >
            + New
          </button>
        </div>
      </div>

      {showCreate && (
        <Card variant="elevated" className="space-y-3 animate-slide-down">
          <h3 className="font-semibold text-sm">Create a Crew</h3>
          <Input
            value={crewName}
            onChange={(e) => setCrewName(e.target.value)}
            placeholder="Crew name (e.g. Saturday Skins)"
            autoFocus
            inputSize="sm"
            maxLength={50}
          />
          {crewNameError && <p className="text-birdie-red text-xs mt-1">{crewNameError}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleCreateCrew} disabled={!crewName.trim() || !!crewNameError || submitting || createLoading} className="flex-1">
              {createLoading ? <span className="flex items-center gap-2"><Spinner />Creating...</span> : 'Create'}
            </Button>
          </div>
        </Card>
      )}

      {showJoin && (
        <Card variant="elevated" className="space-y-3 animate-slide-down">
          <h3 className="font-semibold text-sm">Join a Crew</h3>
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter invite code"
            autoFocus
            inputSize="sm"
            className="font-mono"
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowJoin(false)} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleJoinCrew} disabled={!joinCode.trim() || submitting || joinLoading} className="flex-1">
              {joinLoading ? <span className="flex items-center gap-2"><Spinner />Joining...</span> : 'Join'}
            </Button>
          </div>
        </Card>
      )}

      {crews.length === 0 && !showCreate && !showJoin ? (
        <EmptyState
          icon="👥"
          title="No crews yet"
          description="Create a crew or join one with an invite code to play with your regulars."
          actionLabel="Create a Crew"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-3">
          {crews.map((crew) => (
            <Card key={crew.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{crew.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{crew.memberCount} member{crew.memberCount !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => shareInvite(crew.invite_code, 'crew')}
                  className="text-xs font-medium text-masters-green tap-target px-2 py-1"
                >
                  Share
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {crew.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-1.5 bg-rough dark:bg-night-border rounded-full px-3 py-1">
                    <span className="text-xs">{m.avatar_url ? '🖼' : '👤'}</span>
                    <span className="text-xs font-medium">{m.display_name}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                Code: <span className="font-mono font-medium text-gray-500">{crew.invite_code}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
