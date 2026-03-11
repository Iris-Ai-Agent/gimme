import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
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
      <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-rough dark:bg-night-border rounded-xl" />
          <div className="h-24 bg-rough dark:bg-night-border rounded-2xl" />
          <div className="h-24 bg-rough dark:bg-night-border rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6 text-center">
        <h1 className="text-xl font-bold">Profile</h1>
        <Card variant="elevated" className="space-y-4 py-8">
          <span className="text-5xl">👤</span>
          <p className="text-gray-500">Sign in to manage your profile, handicap, and payment info.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </Card>
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
    <div className="px-4 pt-6 pb-48 max-w-lg mx-auto space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold">Profile</h1>

      <Card variant="elevated">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-masters-green/10 flex items-center justify-center text-2xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : '👤'}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{profile?.display_name || user.email}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
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
              className="text-sm font-medium text-masters-green tap-target min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Handicap</span>
              <span className="font-medium">{profile?.handicap_index ?? 'Not set'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Venmo</span>
              <span className="font-medium">{profile?.venmo_handle ? `@${profile.venmo_handle}` : 'Not set'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cash App</span>
              <span className="font-medium">{profile?.cashapp_handle ? `$${profile.cashapp_handle}` : 'Not set'}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                inputSize="sm"
                maxLength={50}
              />
              {displayNameError && <p className="text-birdie-red text-xs mt-1">{displayNameError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Handicap Index</label>
              <Input
                type="number"
                step="0.1"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
                placeholder="e.g. 12.3"
                inputSize="sm"
              />
              {handicapError && <p className="text-birdie-red text-xs mt-1">{handicapError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Venmo Handle</label>
              <Input
                value={venmo}
                onChange={(e) => setVenmo(e.target.value)}
                placeholder="username"
                inputSize="sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cash App Handle</label>
              <Input
                value={cashapp}
                onChange={(e) => setCashapp(e.target.value)}
                placeholder="username"
                inputSize="sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" onClick={() => setEditing(false)} className="flex-1" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !!displayNameError || !!handicapError} className="flex-1" size="sm">
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Button fullWidth variant="ghost" className="text-birdie-red" onClick={() => setShowSignOut(true)}>
        Sign Out
      </Button>

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
  )
}
