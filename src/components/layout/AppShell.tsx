import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function AppShell() {
  const online = useOnlineStatus()
  return (
    <div className="min-h-dvh pb-20 safe-top">
      {!online && (
        <div className="bg-amber-500 text-white text-xs text-center py-1.5 font-medium animate-fade-in">
          You're offline — scores will sync when connected
        </div>
      )}
      <Outlet />
      <BottomNav />
    </div>
  )
}
