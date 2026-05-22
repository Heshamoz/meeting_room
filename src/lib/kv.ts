/**
 * Upstash Redis wrapper for room storage.
 * Works on Netlify, Vercel, and any serverless platform.
 * Falls back to in-memory store for local dev without Redis configured.
 */

import type { Room } from '@/types'

// In-memory fallback for local dev (rooms reset on restart)
const memStore = new Map<string, string>()

async function getRedis() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis')
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return null
}

async function kvGet(key: string): Promise<string | null> {
  const redis = await getRedis()
  if (redis) {
    const val = await redis.get<string>(key)
    return val ?? null
  }
  return memStore.get(key) ?? null
}

async function kvSet(key: string, value: string): Promise<void> {
  const redis = await getRedis()
  if (redis) {
    await redis.set(key, value)
    return
  }
  memStore.set(key, value)
}

// ---- Room CRUD ----

const ROOMS_KEY = 'rooms:all'

export async function getAllRooms(): Promise<Room[]> {
  const data = await kvGet(ROOMS_KEY)
  if (!data) return []
  try {
    return JSON.parse(data) as Room[]
  } catch {
    return []
  }
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
  await kvSet(ROOMS_KEY, JSON.stringify(rooms))
}

export async function deleteRoom(id: string): Promise<void> {
  const rooms = await getAllRooms()
  const filtered = rooms.filter((r) => r.id !== id)
  await kvSet(ROOMS_KEY, JSON.stringify(filtered))
}
