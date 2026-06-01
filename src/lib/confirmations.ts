// Direct Supabase REST API calls (no SDK) — consistent with kv.ts

function getConfig() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return { url, key }
}

function h(key: string) {
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=representation',
  }
}

const TABLE = 'booking_confirmations'

export async function registerEvent(eventId: string, roomId: string, startTime: string): Promise<void> {
  const cfg = getConfig()
  if (!cfg) return
  try {
    await fetch(`${cfg.url}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { ...h(cfg.key), Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify({ event_id: eventId, room_id: roomId, start_time: startTime, confirmed: false }),
      cache: 'no-store',
    })
  } catch { /* ignore */ }
}

export async function confirmEvent(eventId: string): Promise<boolean> {
  const cfg = getConfig()
  if (!cfg) return false
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/${TABLE}?event_id=eq.${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: h(cfg.key),
        body: JSON.stringify({ confirmed: true }),
        cache: 'no-store',
      }
    )
    return res.ok
  } catch {
    return false
  }
}

export async function isEventConfirmed(eventId: string): Promise<boolean | null> {
  const cfg = getConfig()
  if (!cfg) return null
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/${TABLE}?event_id=eq.${encodeURIComponent(eventId)}&select=confirmed`,
      { headers: h(cfg.key), cache: 'no-store' }
    )
    if (!res.ok) return null
    const rows: { confirmed: boolean }[] = await res.json()
    return rows[0]?.confirmed ?? null
  } catch {
    return null
  }
}

export async function getExpiredUnconfirmed(): Promise<Array<{ event_id: string; room_id: string }>> {
  const cfg = getConfig()
  if (!cfg) return []
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const res = await fetch(
      `${cfg.url}/rest/v1/${TABLE}?confirmed=eq.false&start_time=lt.${encodeURIComponent(cutoff)}&select=event_id,room_id`,
      { headers: h(cfg.key), cache: 'no-store' }
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function deleteConfirmation(eventId: string): Promise<void> {
  const cfg = getConfig()
  if (!cfg) return
  try {
    await fetch(
      `${cfg.url}/rest/v1/${TABLE}?event_id=eq.${encodeURIComponent(eventId)}`,
      { method: 'DELETE', headers: h(cfg.key), cache: 'no-store' }
    )
  } catch { /* ignore */ }
}
