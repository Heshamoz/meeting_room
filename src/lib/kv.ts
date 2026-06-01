import { createClient } from '@supabase/supabase-js'
import type { Room } from '@/types'

// In-memory fallback for local dev
const memStore: Room[] = []

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function getAllRooms(): Promise<Room[]> {
  const supabase = getSupabase()
  if (!supabase) return [...memStore]

  try {
    // Use select('id, data') — same style as getRoomById which works
    const { data, error } = await supabase
      .from('rooms')
      .select('id, data')

    if (error) {
      console.error('getAllRooms supabase error:', error.message, error.code)
      return []
    }
    if (!data || data.length === 0) return []
    return data.map((row: { id: string; data: Room }) => row.data)
  } catch (e) {
    console.error('getAllRooms exception:', e)
    return []
  }
}

export async function getRoomById(id: string): Promise<Room | null> {
  const supabase = getSupabase()
  if (!supabase) return memStore.find((r) => r.id === id) ?? null

  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('data')
      .eq('id', id)
      .single()

    if (error) return null
    return data?.data as Room ?? null
  } catch {
    return null
  }
}

export async function saveRoom(room: Room): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) {
    const idx = memStore.findIndex((r) => r.id === room.id)
    if (idx >= 0) memStore[idx] = room
    else memStore.push(room)
    return
  }

  try {
    await supabase.from('rooms').upsert({
      id: room.id,
      data: room,
      created_at: room.createdAt,
    })
  } catch (e) {
    console.error('saveRoom error:', e)
  }
}

export async function deleteRoom(id: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) {
    const idx = memStore.findIndex((r) => r.id === id)
    if (idx >= 0) memStore.splice(idx, 1)
    return
  }

  try {
    await supabase.from('rooms').delete().eq('id', id)
  } catch (e) {
    console.error('deleteRoom error:', e)
  }
}
