import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_KEY ?? ''

  // Show actual URL so we can verify it's correct
  const urlPreview = url ? url.replace('https://', '').split('.')[0] : 'NOT SET'

  if (!url || !key) {
    return NextResponse.json({ problem: 'missing_env', urlPreview, hasKey: !!key })
  }

  try {
    const sb = createClient(url, key, { auth: { persistSession: false } })
    const { data, error } = await sb.from('rooms').select('id').limit(5)
    if (error) {
      return NextResponse.json({ problem: 'db_error', urlPreview, message: error.message })
    }
    return NextResponse.json({ status: 'ok', urlPreview, rooms_count: data?.length ?? 0 })
  } catch (e) {
    return NextResponse.json({ problem: 'exception', urlPreview, message: String(e) })
  }
}
