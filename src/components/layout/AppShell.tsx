import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { InstallPrompt } from '@/components/ui/InstallPrompt'

export function AppShell() {
  const online = useOnlineStatus()
  return (
    <div className="min-h-dvh bg-cream">
      <div className="max-w-md mx-auto min-h-dvh shadow-xl bg-cream text-text-primary pb-20">
        {!online && (
          <div className="bg-amber-500 text-white text-xs text-center py-1.5 font-medium animate-fade-in">
            You're offline — scores will sync when connected
          </div>
        )}
        <Outlet />
        <InstallPrompt />
        <BottomNav />
      </div>
    </div>
  )
}
