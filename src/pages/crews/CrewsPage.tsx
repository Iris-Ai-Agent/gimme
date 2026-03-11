import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db as supabase } from '@/lib/supabase'
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

      const crewIds = memberRows.map((r: any) => r.crew_id)

      // Fetch all members first to get profile IDs
      const { data: allMembers } = await supabase
        .from('crew_members')
        .select('crew_id, profile_id')
        .in('crew_id', crewIds)

      // Now fetch crews and profiles in parallel (both independent once we have IDs)
      const allProfileIds = [...new Set((allMembers || []).map((m: any) => m.profile_id))]
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

      const result: CrewWithMembers[] = (crewData || []).map((crew: any) => {
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
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="w-full px-4 py-4" style={{ backgroundColor: '#2D4A3E' }}>
          <h1 className="text-lg font-bold text-[#F5F0E8]">My Crews</h1>
        </div>
        <div className="px-4 pt-6 max-w-lg mx-auto">
          <EmptyState
            icon="👥"
            title="Sign in to manage crews"
            description="Create or join a crew to play regularly with friends."
            actionLabel="Sign In"
            onAction={() => navigate('/auth')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header */}
      <div className="w-full px-4 py-4 flex items-center justify-between" style={{ backgroundColor: '#2D4A3E' }}>
        <h1 className="text-lg font-bold text-[#F5F0E8]">My Crews</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false) }}
            className="text-sm font-medium tap-target px-3 py-1 rounded-lg transition-colors"
            style={{ color: '#F5F0E8', border: '1px solid rgba(245,240,232,0.3)' }}
          >
            Join
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false) }}
            className="text-sm font-bold tap-target px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
          >
            + New
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 max-w-lg mx-auto w-full space-y-4">
        {showCreate && (
          <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3 animate-slide-down" style={{ borderColor: '#2D4A3E10' }}>
            <h3 className="font-bold text-sm" style={{ color: '#2D4A3E' }}>Create a Crew</h3>
            <Input
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              placeholder="Crew name (e.g. Saturday Skins)"
              autoFocus
              inputSize="sm"
              maxLength={50}
              className="border-[#2D4A3E]/30 focus:border-[#2D4A3E]"
            />
            {crewNameError && <p className="text-birdie-red text-xs mt-1">{crewNameError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border-2 tap-target"
                style={{ borderColor: '#2D4A3E', color: '#2D4A3E' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCrew}
                disabled={!crewName.trim() || !!crewNameError || submitting || createLoading}
                className="flex-1 py-2 rounded-xl text-sm font-bold tap-target disabled:opacity-50"
                style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
              >
                {createLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Creating...</span> : 'Create'}
              </button>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3 animate-slide-down" style={{ borderColor: '#2D4A3E10' }}>
            <h3 className="font-bold text-sm" style={{ color: '#2D4A3E' }}>Join a Crew</h3>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter invite code"
              autoFocus
              inputSize="sm"
              className="font-mono border-[#2D4A3E]/30 focus:border-[#2D4A3E]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoin(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border-2 tap-target"
                style={{ borderColor: '#2D4A3E', color: '#2D4A3E' }}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinCrew}
                disabled={!joinCode.trim() || submitting || joinLoading}
                className="flex-1 py-2 rounded-xl text-sm font-bold tap-target disabled:opacity-50"
                style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
              >
                {joinLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Joining...</span> : 'Join'}
              </button>
            </div>
          </div>
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
              <div key={crew.id} className="bg-white rounded-2xl p-4 border shadow-sm space-y-3" style={{ borderColor: '#2D4A3E10' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold" style={{ color: '#2D4A3E' }}>{crew.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#2D4A3E', opacity: 0.5 }}>{crew.memberCount} member{crew.memberCount !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => shareInvite(crew.invite_code, 'crew')}
                    className="text-xs font-bold tap-target px-2 py-1"
                    style={{ color: '#C4A962' }}
                  >
                    Share
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {crew.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: '#2D4A3E10' }}>
                      <span className="text-xs">👤</span>
                      <span className="text-xs font-medium" style={{ color: '#2D4A3E' }}>{m.display_name}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs" style={{ color: '#2D4A3E', opacity: 0.5 }}>
                  Code: <span className="font-mono font-medium">{crew.invite_code}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
