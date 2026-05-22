import { getRoomById } from '@/lib/kv'
import { getRoomEvents } from '@/lib/google-calendar'
import { notFound } from 'next/navigation'
import RoomDisplay from '@/components/room/RoomDisplay'

interface Props { params: { roomId: string } }

export const revalidate = 0

export default async function RoomDisplayPage({ params }: Props) {
  const room = await getRoomById(params.roomId)
  if (!room) notFound()

  const events = await getRoomEvents(room.calendarId)
  const { pin: _, ...safeRoom } = room

  return <RoomDisplay room={safeRoom} initialEvents={events} />
}
