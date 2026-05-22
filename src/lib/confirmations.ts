import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function registerEvent(eventId: string, roomId: string, startTime: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.from('booking_confirmations').upsert(
    { event_id: eventId, room_id: roomId, start_time: startTime, confirmed: false },
    { onConflict: 'event_id', ignoreDuplicates: true }
  )
}

export async function confirmEvent(eventId: string): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  const { error } = await supabase.from('booking_confirmations')
    .update({ confirmed: true })
    .eq('event_id', eventId)
  return !error
}

export async function isEventConfirmed(eventId: string): Promise<boolean | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.from('booking_confirmations')
    .select('confirmed')
    .eq('event_id', eventId)
    .single()
  if (!data) return null
  return data.confirmed
}

export async function getExpiredUnconfirmed(): Promise<Array<{ event_id: string; room_id: string }>> {
  const supabase = getSupabase()
  if (!supabase) return []
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data } = await supabase.from('booking_confirmations')
    .select('event_id, room_id')
    .eq('confirmed', false)
    .lt('start_time', cutoff)
  return data || []
}

export async function deleteConfirmation(eventId: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.from('booking_confirmations').delete().eq('event_id', eventId)
}
