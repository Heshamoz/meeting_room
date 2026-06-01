import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    return NextResponse.json({
      status: 'error',
      message: 'SUPABASE_URL أو SUPABASE_SERVICE_KEY غير موجودة في بيئة Vercel',
      supabase_url: !!url,
      supabase_key: !!key,
    })
  }

  try {
    const supabase = createClient(url, key)
    const { data, error } = await supabase.from('rooms').select('*')
    if (error) {
      return NextResponse.json({ status: 'error', message: error.message, code: error.code })
    }
    return NextResponse.json({
      status: 'ok',
      rooms_count: data?.length ?? 0,
      room_ids: data?.map((r) => r.id) ?? [],
    })
  } catch (e) {
    return NextResponse.json({ status: 'exception', message: String(e) })
  }
}
