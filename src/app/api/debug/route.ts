import { NextResponse } from 'next/server'

export async function GET() {
  const url = (process.env.SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_KEY ?? '').trim()

  const urlPreview = url ? url.replace('https://', '').split('.')[0] : 'NOT_SET'
  const keyPreview = key ? key.slice(0, 20) + '...' : 'NOT_SET'

  if (!url || !key) {
    return NextResponse.json({ problem: 'missing_env', urlPreview, keyPreview })
  }

  // Test with raw fetch (no SDK)
  try {
    const res = await fetch(`${url}/rest/v1/rooms?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    const text = await res.text()
    return NextResponse.json({
      status: 'ok',
      urlPreview,
      keyPreview,
      httpStatus: res.status,
      response: text.slice(0, 200),
    })
  } catch (e) {
    return NextResponse.json({
      status: 'fetch_failed',
      urlPreview,
      keyPreview,
      error: String(e),
    })
  }
}
