import { NextResponse } from 'next/server'
import { confirmEvent } from '@/lib/confirmations'

interface Params { params: { id: string } }

export async function POST(req: Request, { params: _ }: Params) {
  const body = await req.json()
  const { eventId } = body

  if (!eventId) {
    return NextResponse.json({ error: 'eventId مطلوب' }, { status: 400 })
  }

  const success = await confirmEvent(eventId)
  if (!success) {
    return NextResponse.json({ error: 'فشل التأكيد' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
