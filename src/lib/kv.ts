import { createClient } from '@supabase/supabase-js'
import type { Room } from '@/types'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: fetch.bind(globalThis) },
  })
}

export async function getAllRooms(): Promise<Room[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb.from('rooms').select('id, data')
  if (error) { console.error('getAllRooms:', error.message); return [] }
  return (data || []).map((r: { data: Room }) => r.data)
}

export async function getRoomById(id: string): Promise<Room | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('rooms').select('data').eq('id', id).single()
  if (error) return null
  return (data as { data: Room })?.data ?? null
}

export async function saveRoom(room: Room): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  const { error } = await sb.from('rooms').upsert({ id: room.id, data: room }, { onConflict: 'id' })
  if (error) console.error('saveRoom:', error.message)
}

export async function deleteRoom(id: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  const { error } = await sb.from('rooms').delete().eq('id', id)
  if (error) console.error('deleteRoom:', error.message)
}
