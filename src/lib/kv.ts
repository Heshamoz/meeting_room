import { getStore } from '@netlify/blobs'
import type { Room } from '@/types'

const STORE_NAME = 'meeting-rooms'
const ROOMS_KEY = 'rooms'

// In-memory fallback for local dev
const memStore: Room[] = []

function store() {
  return getStore({ name: STORE_NAME, consistency: 'strong' })
}

export async function getAllRooms(): Promise<Room[]> {
  try {
    const data = await store().get(ROOMS_KEY, { type: 'json' })
    return Array.isArray(data) ? (data as Room[]) : []
  } catch {
    return [...memStore]
  }
}

export async function getRoomById(id: string): Promise<Room | null> {
  const rooms = await getAllRooms()
  return rooms.find((r) => r.id === id) ?? null
}

export async function saveRoom(room: Room): Promise<void> {
  try {
    const rooms = await getAllRooms()
    const idx = rooms.findIndex((r) => r.id === room.id)
    if (idx >= 0) rooms[idx] = room
    else rooms.push(room)
    await store().setJSON(ROOMS_KEY, rooms)
  } catch {
    const idx = memStore.findIndex((r) => r.id === room.id)
    if (idx >= 0) memStore[idx] = room
    else memStore.push(room)
  }
}

export async function deleteRoom(id: string): Promise<void> {
  try {
    const rooms = await getAllRooms()
    await store().setJSON(ROOMS_KEY, rooms.filter((r) => r.id !== id))
  } catch {
    const idx = memStore.findIndex((r) => r.id === id)
    if (idx >= 0) memStore.splice(idx, 1)
  }
}
