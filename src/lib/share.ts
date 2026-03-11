import { toast } from '@/components/ui/Toast'

export async function shareInvite(code: string, type: 'round' | 'crew') {
  const url = `${window.location.origin}/round/join?code=${code}`
  const title = type === 'round' ? 'Join my round on Gimme' : 'Join my crew on Gimme'
  try {
    if (navigator.share) {
      await navigator.share({ title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast('success', 'Link copied!')
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      await navigator.clipboard.writeText(code)
      toast('success', 'Code copied!')
    }
  }
}
