import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/kv'
import { getRoomEvents } from '@/lib/google-calendar'

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'القاعة غير موجودة' }, { status: 404 })

  try {
    const events = await getRoomEvents(room.calendarId)
    return NextResponse.json({ events })
  } catch (err) {
    console.error('Calendar fetch error:', err)
    return NextResponse.json({ error: 'فشل في جلب الاجتماعات' }, { status: 500 })
  }
}
