'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  roomId: string
  roomName: string
}

export default function DeleteRoomButton({ roomId, roomName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`هل أنت متأكد من حذف قاعة "${roomName}"؟ لا يمكن التراجع.`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'حذف'}
    </button>
  )
}
