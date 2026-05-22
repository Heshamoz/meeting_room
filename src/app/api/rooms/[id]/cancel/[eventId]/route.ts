import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/kv'
import { cancelEvent } from '@/lib/google-calendar'

interface Params { params: { id: string; eventId: string } }

export async function DELETE(_req: Request, { params }: Params) {
  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'القاعة غير موجودة' }, { status: 404 })

  try {
    await cancelEvent(room.calendarId, params.eventId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel error:', err)
    return NextResponse.json({ error: 'فشل إلغاء الحجز' }, { status: 500 })
  }
}
