import type { Room } from '@/types'

// ── Supabase REST helpers (no SDK, plain fetch) ──────────────────────────────

function getConfig() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return { url, key }
}

function headers(key: string) {
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=representation',
  }
}

function restUrl(base: string, table: string, query = '') {
  return `${base}/rest/v1/${table}${query ? '?' + query : ''}`
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getAllRooms(): Promise<Room[]> {
  const cfg = getConfig()
  if (!cfg) return []

  try {
    const res = await fetch(restUrl(cfg.url, 'rooms', 'select=id,data'), {
      headers: headers(cfg.key),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('getAllRooms HTTP error:', res.status, await res.text())
      return []
    }
    const rows: { id: string; data: Room }[] = await res.json()
    return rows.map((r) => r.data)
  } catch (e) {
    console.error('getAllRooms error:', e)
    return []
  }
}

export async function getRoomById(id: string): Promise<Room | null> {
  const cfg = getConfig()
  if (!cfg) return null

  try {
    const res = await fetch(
      restUrl(cfg.url, 'rooms', `select=data&id=eq.${encodeURIComponent(id)}`),
      { headers: headers(cfg.key), cache: 'no-store' }
    )
    if (!res.ok) return null
    const rows: { data: Room }[] = await res.json()
    return rows[0]?.data ?? null
  } catch {
    return null
  }
}

export async function saveRoom(room: Room): Promise<void> {
  const cfg = getConfig()
  if (!cfg) return

  try {
    const res = await fetch(restUrl(cfg.url, 'rooms'), {
      method: 'POST',
      headers: { ...headers(cfg.key), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ id: room.id, data: room }),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('saveRoom HTTP error:', res.status, await res.text())
    }
  } catch (e) {
    console.error('saveRoom error:', e)
  }
}

export async function deleteRoom(id: string): Promise<void> {
  const cfg = getConfig()
  if (!cfg) return

  try {
    const res = await fetch(
      restUrl(cfg.url, 'rooms', `id=eq.${encodeURIComponent(id)}`),
      { method: 'DELETE', headers: headers(cfg.key), cache: 'no-store' }
    )
    if (!res.ok) {
      console.error('deleteRoom HTTP error:', res.status, await res.text())
    }
  } catch (e) {
    console.error('deleteRoom error:', e)
  }
}
