import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home', icon: '⛳' },
  { to: '/crews', label: 'Crews', icon: '👥' },
  { to: '/history', label: 'History', icon: '📊' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-night-card border-t border-rough dark:border-night-border safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 tap-target transition-colors ${
                isActive
                  ? 'text-masters-green dark:text-gold'
                  : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
