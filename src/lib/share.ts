import { toast } from '@/components/ui/Toast'

export async function shareInvite(code: string, type: 'round' | 'crew') {
  const path = type === 'round' ? '/round/join' : '/crews'
  const url = `${window.location.origin}${path}?code=${code}`
  const title = type === 'round' ? 'Join my round on Bogey Bookie' : 'Join my crew on Bogey Bookie'
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
