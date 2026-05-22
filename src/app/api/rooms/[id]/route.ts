import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRoomById, saveRoom, deleteRoom } from '@/lib/kv'
import bcrypt from 'bcryptjs'

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { pin: _, ...safe } = room
  return NextResponse.json(safe)
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, calendarId, pin, color, capacity, floor, amenities } = body

  const updated = {
    ...room,
    name: name ?? room.name,
    calendarId: calendarId ?? room.calendarId,
    color: color ?? room.color,
    capacity: capacity !== undefined ? Number(capacity) : room.capacity,
    floor: floor !== undefined ? floor : room.floor,
    amenities: amenities ?? room.amenities,
    updatedAt: new Date().toISOString(),
  }

  if (pin) {
    if (pin.length < 4 || !/^\d+$/.test(pin)) {
      return NextResponse.json({ error: 'PIN يجب أن يكون 4-8 أرقام' }, { status: 400 })
    }
    updated.pin = await bcrypt.hash(pin, 10)
  }

  await saveRoom(updated)
  const { pin: _, ...safe } = updated
  return NextResponse.json(safe)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteRoom(params.id)
  return NextResponse.json({ success: true })
}
