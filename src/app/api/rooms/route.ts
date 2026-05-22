import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllRooms, saveRoom } from '@/lib/kv'
import { generateId } from '@/lib/utils'
import bcrypt from 'bcryptjs'
import type { Room } from '@/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rooms = await getAllRooms()
  // Don't expose hashed PINs
  const safe = rooms.map(({ pin: _, ...r }) => r)
  return NextResponse.json(safe)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, calendarId, pin, color, capacity, floor, amenities } = body

  if (!name || !calendarId || !pin) {
    return NextResponse.json({ error: 'اسم القاعة، Calendar ID، ورمز PIN مطلوبة' }, { status: 400 })
  }

  if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
    return NextResponse.json({ error: 'PIN يجب أن يكون 4-8 أرقام' }, { status: 400 })
  }

  const hashedPin = await bcrypt.hash(pin, 10)
  const now = new Date().toISOString()

  const room: Room = {
    id: generateId(),
    name,
    calendarId,
    pin: hashedPin,
    color: color || 'blue',
    capacity: Number(capacity) || 10,
    floor: floor || undefined,
    amenities: amenities || [],
    createdAt: now,
    updatedAt: now,
  }

  await saveRoom(room)
  const { pin: _, ...safe } = room
  return NextResponse.json(safe, { status: 201 })
}
