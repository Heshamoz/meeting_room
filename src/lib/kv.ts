import type { Room } from '@/types'

function sbFetch(path: string, options: RequestInit = {}) {
  const url = (process.env.SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_KEY ?? '').trim()
  return fetch(`${url}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
}

export async function getAllRooms(): Promise<Room[]> {
  try {
    const res = await sbFetch('/rooms?select=id,data')
    if (!res.ok) return []
    const rows = await res.json() as Array<{ data: Room }>
    return rows.map(r => r.data)
  } catch {
    return []
  }
}

export async function getRoomById(id: string): Promise<Room | null> {
  try {
    const res = await sbFetch(`/rooms?select=data&id=eq.${encodeURIComponent(id)}`)
    if (!res.ok) return null
    const rows = await res.json() as Array<{ data: Room }>
    return rows[0]?.data ?? null
  } catch {
    return null
  }
}

export async function saveRoom(room: Room): Promise<void> {
  try {
    await sbFetch('/rooms', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' } as Record<string, string>,
      body: JSON.stringify({ id: room.id, data: room }),
    })
  } catch (e) {
    console.error('saveRoom:', e)
  }
}

export async function deleteRoom(id: string): Promise<void> {
  try {
    await sbFetch(`/rooms?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch (e) {
    console.error('deleteRoom:', e)
  }
}
