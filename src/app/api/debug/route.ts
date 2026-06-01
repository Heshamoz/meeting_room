import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    return NextResponse.json({ status: 'missing_env', supabase_url: !!url, supabase_key: !!key })
  }

  try {
    const res = await fetch(`${url}/rest/v1/rooms?select=id,data`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    })

    const text = await res.text()

    if (!res.ok) {
      return NextResponse.json({ status: 'http_error', http_status: res.status, body: text })
    }

    const rows = JSON.parse(text)
    return NextResponse.json({
      status: 'ok',
      rooms_count: rows.length,
      room_ids: rows.map((r: { id: string }) => r.id),
    })
  } catch (e) {
    return NextResponse.json({ status: 'exception', message: String(e) })
  }
}
