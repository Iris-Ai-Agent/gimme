import { useEffect, useState, useCallback, useRef } from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  text: string
}

let toastListeners: Array<(msg: ToastMessage) => void> = []

export function toast(type: ToastMessage['type'], text: string) {
  const msg: ToastMessage = { id: crypto.randomUUID(), type, text }
  toastListeners.forEach((fn) => fn(msg))
}

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([])
  const timeoutIds = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissMessage = useCallback((id: string) => {
    const tid = timeoutIds.current.get(id)
    if (tid) {
      clearTimeout(tid)
      timeoutIds.current.delete(id)
    }
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const addMessage = useCallback((msg: ToastMessage) => {
    setMessages((prev) => [...prev, msg])
    const tid = setTimeout(() => {
      timeoutIds.current.delete(msg.id)
      setMessages((prev) => prev.filter((m) => m.id !== msg.id))
    }, 3500)
    timeoutIds.current.set(msg.id, tid)
  }, [])

  useEffect(() => {
    toastListeners.push(addMessage)
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addMessage)
      // Clear all pending timeouts on unmount
      timeoutIds.current.forEach((tid) => clearTimeout(tid))
      timeoutIds.current.clear()
    }
  }, [addMessage])

  if (messages.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {messages.map((msg) => (
        <div
          key={msg.id}
          role="alert"
          aria-live="assertive"
          onClick={() => dismissMessage(msg.id)}
          className={`
            pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium
            max-w-sm w-full animate-slide-down cursor-pointer
            ${msg.type === 'error' ? 'bg-birdie-red text-white' : ''}
            ${msg.type === 'success' ? 'bg-masters-green text-white' : ''}
            ${msg.type === 'info' ? 'bg-night-card text-white' : ''}
          `}
        >
          {msg.text}
        </div>
      ))}
    </div>
  )
}
