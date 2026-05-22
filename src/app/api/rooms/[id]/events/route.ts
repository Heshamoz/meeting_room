import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/kv'
import { getRoomEvents, cancelEvent } from '@/lib/google-calendar'
import { registerEvent, isEventConfirmed, getExpiredUnconfirmed, deleteConfirmation } from '@/lib/confirmations'

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'القاعة غير موجودة' }, { status: 404 })

  try {
    const events = await getRoomEvents(room.calendarId)

    // Find current event
    const now = new Date()
    const currentEvent = events.find((e) => {
      if (e.status === 'cancelled') return false
      return new Date(e.startTime) <= now && new Date(e.endTime) >= now
    })

    let currentEventConfirmed: boolean | null = null

    if (currentEvent) {
      await registerEvent(currentEvent.id, room.id, currentEvent.startTime)
      currentEventConfirmed = await isEventConfirmed(currentEvent.id)
    }

    // Cleanup: auto-delete unconfirmed meetings past 30 minutes
    const expired = await getExpiredUnconfirmed()
    for (const item of expired) {
      try {
        const expiredRoom = await getRoomById(item.room_id)
        if (expiredRoom) await cancelEvent(expiredRoom.calendarId, item.event_id)
      } catch { /* ignore calendar errors */ }
      await deleteConfirmation(item.event_id)
    }

    return NextResponse.json({ events, currentEventConfirmed })
  } catch (err) {
    console.error('Calendar fetch error:', err)
    return NextResponse.json({ error: 'فشل في جلب الاجتماعات' }, { status: 500 })
  }
}
