import { useNavigate } from 'react-router-dom'

export function BackButton() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(-1)} aria-label="Go back" className="tap-target text-cream hover:text-cream/80 transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded-lg">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}
