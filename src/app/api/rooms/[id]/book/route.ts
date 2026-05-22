import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/kv'
import { createBooking } from '@/lib/google-calendar'
import type { BookingRequest } from '@/types'

interface Params { params: { id: string } }

export async function POST(req: Request, { params }: Params) {
  const body = await req.json()
  const { title, organizerEmail, organizerName, attendeeEmails, startTime, endTime, description } = body

  if (!title || !organizerEmail || !startTime || !endTime) {
    return NextResponse.json({ error: 'عنوان الاجتماع، البريد الإلكتروني، وأوقات البداية والنهاية مطلوبة' }, { status: 400 })
  }

  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'القاعة غير موجودة' }, { status: 404 })

  // Basic time validation
  const start = new Date(startTime)
  const end = new Date(endTime)
  if (end <= start) {
    return NextResponse.json({ error: 'وقت النهاية يجب أن يكون بعد وقت البداية' }, { status: 400 })
  }
  if (start < new Date()) {
    return NextResponse.json({ error: 'لا يمكن الحجز في وقت ماضٍ' }, { status: 400 })
  }

  const booking: BookingRequest = {
    title,
    description,
    organizerEmail,
    organizerName,
    attendeeEmails: attendeeEmails || [],
    startTime,
    endTime,
  }

  try {
    const event = await createBooking(room.calendarId, booking)
    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'فشل إنشاء الحجز. تحقق من إعدادات Google Calendar.' }, { status: 500 })
  }
}
