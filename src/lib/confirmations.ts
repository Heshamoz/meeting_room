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

const T = 'booking_confirmations'

export async function registerEvent(eventId: string, roomId: string, startTime: string): Promise<void> {
  try {
    await sbFetch(`/${T}`, {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates' } as Record<string, string>,
      body: JSON.stringify({ event_id: eventId, room_id: roomId, start_time: startTime, confirmed: false }),
    })
  } catch { /* ignore */ }
}

export async function confirmEvent(eventId: string): Promise<boolean> {
  try {
    const res = await sbFetch(`/${T}?event_id=eq.${encodeURIComponent(eventId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ confirmed: true }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function isEventConfirmed(eventId: string): Promise<boolean | null> {
  try {
    const res = await sbFetch(`/${T}?select=confirmed&event_id=eq.${encodeURIComponent(eventId)}`)
    if (!res.ok) return null
    const rows = await res.json() as Array<{ confirmed: boolean }>
    return rows[0]?.confirmed ?? null
  } catch {
    return null
  }
}

export async function getExpiredUnconfirmed(): Promise<Array<{ event_id: string; room_id: string }>> {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const res = await sbFetch(
      `/${T}?select=event_id,room_id&confirmed=eq.false&start_time=lt.${encodeURIComponent(cutoff)}`
    )
    if (!res.ok) return []
    return await res.json() as Array<{ event_id: string; room_id: string }>
  } catch {
    return []
  }
}

export async function deleteConfirmation(eventId: string): Promise<void> {
  try {
    await sbFetch(`/${T}?event_id=eq.${encodeURIComponent(eventId)}`, { method: 'DELETE' })
  } catch { /* ignore */ }
}
