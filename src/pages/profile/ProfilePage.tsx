import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/stores/auth'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, loading, updateProfile, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [handicap, setHandicap] = useState(profile?.handicap_index?.toString() || '')
  const [venmo, setVenmo] = useState(profile?.venmo_handle || '')
  const [cashapp, setCashapp] = useState(profile?.cashapp_handle || '')
  const [saving, setSaving] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const displayNameError = editing && displayName.trim().length === 0
    ? 'Display name is required'
    : editing && displayName.trim().length > 50
      ? 'Display name must be 50 characters or less'
      : ''
  const handicapError = editing && handicap !== ''
    ? (isNaN(parseFloat(handicap)) || parseFloat(handicap) < 0 || parseFloat(handicap) > 54
        ? 'Handicap must be between 0 and 54'
        : '')
    : ''

  if (loading) {
    return (
      <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="w-full px-4 py-4" style={{ backgroundColor: '#2D4A3E' }}>
          <h1 className="text-lg font-bold text-[#F5F0E8]">Profile</h1>
        </div>
        <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded-xl" style={{ backgroundColor: '#2D4A3E20' }} />
            <div className="h-24 rounded-2xl" style={{ backgroundColor: '#2D4A3E20' }} />
            <div className="h-24 rounded-2xl" style={{ backgroundColor: '#2D4A3E20' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="w-full px-4 py-4" style={{ backgroundColor: '#2D4A3E' }}>
          <h1 className="text-lg font-bold text-[#F5F0E8]">Profile</h1>
        </div>
        <div className="px-4 pt-6 max-w-lg mx-auto space-y-6 text-center">
          <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-4" style={{ borderColor: '#2D4A3E10' }}>
            <span className="text-5xl">👤</span>
            <p style={{ color: '#2D4A3E', opacity: 0.6 }}>Sign in to manage your profile, handicap, and payment info.</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2.5 rounded-xl font-bold tap-target"
              style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({
        display_name: displayName.trim() || user!.email || 'Golfer',
        handicap_index: handicap ? parseFloat(handicap) : null,
        venmo_handle: venmo.trim() || null,
        cashapp_handle: cashapp.trim() || null,
      })
      setEditing(false)
      toast('success', 'Profile updated!')
    } catch {
      toast('error', 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
    toast('info', 'Signed out')
  }

  return (
    <div className="min-h-dvh flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header */}
      <div className="w-full px-4 py-4" style={{ backgroundColor: '#2D4A3E' }}>
        <h1 className="text-lg font-bold text-[#F5F0E8]">Profile</h1>
      </div>

      <div className="px-4 pt-4 pb-48 max-w-lg mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl p-5 border shadow-sm" style={{ borderColor: '#2D4A3E10' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: '#2D4A3E' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : <span className="text-[#F5F0E8]">👤</span>}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg" style={{ color: '#2D4A3E' }}>{profile?.display_name || user.email}</h2>
              <p className="text-sm" style={{ color: '#2D4A3E', opacity: 0.5 }}>{user.email}</p>
            </div>
            {!editing && (
              <button
                onClick={() => {
                  setDisplayName(profile?.display_name || '')
                  setHandicap(profile?.handicap_index?.toString() || '')
                  setVenmo(profile?.venmo_handle || '')
                  setCashapp(profile?.cashapp_handle || '')
                  setEditing(true)
                }}
                className="text-sm font-bold tap-target min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{ color: '#C4A962' }}
              >
                Edit
              </button>
            )}
          </div>

          {!editing ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#2D4A3E', opacity: 0.5 }}>Handicap</span>
                <span className="font-medium" style={{ color: '#2D4A3E' }}>{profile?.handicap_index ?? 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#2D4A3E', opacity: 0.5 }}>Venmo</span>
                <span className="font-medium" style={{ color: '#2D4A3E' }}>{profile?.venmo_handle ? `@${profile.venmo_handle}` : 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#2D4A3E', opacity: 0.5 }}>Cash App</span>
                <span className="font-medium" style={{ color: '#2D4A3E' }}>{profile?.cashapp_handle ? `$${profile.cashapp_handle}` : 'Not set'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#2D4A3E' }}>Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  inputSize="sm"
                  maxLength={50}
                  className="border-[#2D4A3E]/30 focus:border-[#2D4A3E]"
                />
                {displayNameError && <p className="text-birdie-red text-xs mt-1">{displayNameError}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#2D4A3E' }}>Handicap Index</label>
                <Input
                  type="number"
                  step="0.1"
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  placeholder="e.g. 12.3"
                  inputSize="sm"
                  className="border-[#2D4A3E]/30 focus:border-[#2D4A3E]"
                />
                {handicapError && <p className="text-birdie-red text-xs mt-1">{handicapError}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#2D4A3E' }}>Venmo Handle</label>
                <Input
                  value={venmo}
                  onChange={(e) => setVenmo(e.target.value)}
                  placeholder="username"
                  inputSize="sm"
                  className="border-[#2D4A3E]/30 focus:border-[#2D4A3E]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#2D4A3E' }}>Cash App Handle</label>
                <Input
                  value={cashapp}
                  onChange={(e) => setCashapp(e.target.value)}
                  placeholder="username"
                  inputSize="sm"
                  className="border-[#2D4A3E]/30 focus:border-[#2D4A3E]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border-2 tap-target"
                  style={{ borderColor: '#2D4A3E', color: '#2D4A3E' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !!displayNameError || !!handicapError}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold tap-target disabled:opacity-50"
                  style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowSignOut(true)}
          className="w-full py-3 rounded-xl text-sm font-medium text-birdie-red tap-target transition-colors"
        >
          Sign Out
        </button>

        <ConfirmDialog
          open={showSignOut}
          onConfirm={() => { setShowSignOut(false); handleSignOut() }}
          onCancel={() => setShowSignOut(false)}
          title="Sign Out?"
          description="You'll need to sign in again to access your rounds and stats."
          confirmText="Sign Out"
          confirmVariant="danger"
        />
      </div>
    </div>
  )
}
