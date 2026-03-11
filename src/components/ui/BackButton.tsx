import { useNavigate } from 'react-router-dom'

export function BackButton() {
  const navigate = useNavigate()
  return (
    <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} aria-label="Go back" className="tap-target text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus-visible:ring-2 focus-visible:ring-masters-green focus-visible:ring-offset-2 rounded-lg">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}
