import type { Room } from '@/types'

// In-memory fallback for local dev
const memStore = new Map<string, Room[]>()
const ROOMS_KEY = 'rooms'
const STORE_NAME = 'meeting-rooms'

async function getStore() {
  if (process.env.NETLIFY || process.env.NETLIFY_LOCAL) {
    const { getStore } = await import('@netlify/blobs')
    return getStore({ name: STORE_NAME, consistency: 'strong' })
  }
  return null
}

export async function getAllRooms(): Promise<Room[]> {
  try {
    const store = await getStore()
    if (store) {
      const data = await store.get(ROOMS_KEY, { type: 'json' })
      return Array.isArray(data) ? data : []
    }
  } catch (e) {
    console.error('getAllRooms error:', e)
  }
  return memStore.get(ROOMS_KEY) ?? []
}

export async function getRoomById(id: string): Promise<Room | null> {
  const rooms = await getAllRooms()
  return rooms.find((r) => r.id === id) ?? null
}

export async function saveRoom(room: Room): Promise<void> {
  const rooms = await getAllRooms()
  const idx = rooms.findIndex((r) => r.id === room.id)
  if (idx >= 0) {
    rooms[idx] = room
  } else {
    rooms.push(room)
  }

  try {
    const store = await getStore()
    if (store) {
      await store.setJSON(ROOMS_KEY, rooms)
      return
    }
  } catch (e) {
    console.error('saveRoom error:', e)
  }
  memStore.set(ROOMS_KEY, rooms)
}

export async function deleteRoom(id: string): Promise<void> {
  const rooms = await getAllRooms()
  const filtered = rooms.filter((r) => r.id !== id)

  try {
    const store = await getStore()
    if (store) {
      await store.setJSON(ROOMS_KEY, filtered)
      return
    }
  } catch (e) {
    console.error('deleteRoom error:', e)
  }
  memStore.set(ROOMS_KEY, filtered)
}
