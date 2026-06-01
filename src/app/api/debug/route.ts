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

    // Test 1: same query as getRoomById (known to work)
    const { data: singleData, error: singleError } = await supabase
      .from('rooms').select('id, data').limit(10)

    if (singleError) {
      return NextResponse.json({
        status: 'db_error',
        message: singleError.message,
        code: singleError.code,
        hint: singleError.hint,
      })
    }

    return NextResponse.json({
      status: 'ok',
      rooms_count: singleData?.length ?? 0,
      room_ids: singleData?.map((r: {id: string}) => r.id) ?? [],
    })
  } catch (e) {
    return NextResponse.json({ status: 'exception', message: String(e) })
  }
}
