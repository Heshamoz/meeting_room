import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/kv'
import bcrypt from 'bcryptjs'

interface Params { params: { id: string } }

export async function POST(req: Request, { params }: Params) {
  const body = await req.json()
  const { pin } = body

  if (!pin) return NextResponse.json({ error: 'PIN مطلوب' }, { status: 400 })

  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'القاعة غير موجودة' }, { status: 404 })

  const valid = await bcrypt.compare(String(pin), room.pin)
  if (!valid) return NextResponse.json({ error: 'رمز PIN غير صحيح' }, { status: 401 })

  // Return safe room info (no PIN hash)
  const { pin: _, ...safeRoom } = room
  return NextResponse.json({ success: true, room: safeRoom })
}
