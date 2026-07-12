import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: fetch.bind(globalThis) },
  })
}

const T = 'booking_confirmations'

export async function registerEvent(eventId: string, roomId: string, startTime: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  await sb.from(T).upsert(
    { event_id: eventId, room_id: roomId, start_time: startTime, confirmed: false },
    { onConflict: 'event_id', ignoreDuplicates: true }
  )
}

export async function confirmEvent(eventId: string): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  const { error } = await sb.from(T).update({ confirmed: true }).eq('event_id', eventId)
  return !error
}

export async function isEventConfirmed(eventId: string): Promise<boolean | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.from(T).select('confirmed').eq('event_id', eventId).single()
  return (data as { confirmed: boolean } | null)?.confirmed ?? null
}

export async function getExpiredUnconfirmed(): Promise<Array<{ event_id: string; room_id: string }>> {
  const sb = getSupabase()
  if (!sb) return []
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data } = await sb.from(T).select('event_id, room_id').eq('confirmed', false).lt('start_time', cutoff)
  return data || []
}

export async function deleteConfirmation(eventId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  await sb.from(T).delete().eq('event_id', eventId)
}
