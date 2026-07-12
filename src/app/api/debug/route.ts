import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    return NextResponse.json({ status: 'missing_env', url: !!url, key: !!key })
  }

  try {
    const sb = createClient(url, key, {
      auth: { persistSession: false },
      global: { fetch: fetch.bind(globalThis) },
    })

    // Test read
    const { data: rooms, error: readErr } = await sb.from('rooms').select('id, data')
    if (readErr) {
      return NextResponse.json({ status: 'read_error', message: readErr.message, code: readErr.code })
    }

    // Test insert then delete
    const testId = `debug-${Date.now()}`
    const { error: insertErr } = await sb.from('rooms').insert({ id: testId, data: { id: testId, name: 'test' } })
    const insertOk = !insertErr
    if (insertOk) await sb.from('rooms').delete().eq('id', testId)

    return NextResponse.json({
      status: 'ok',
      rooms_count: rooms?.length ?? 0,
      room_ids: rooms?.map((r: { id: string }) => r.id) ?? [],
      insert_test: insertOk ? 'PASS' : `FAIL: ${insertErr?.message}`,
    })
  } catch (e) {
    return NextResponse.json({ status: 'exception', message: String(e) })
  }
}
