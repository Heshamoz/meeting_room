import { NextResponse } from 'next/server'

export async function GET() {
  const url = (process.env.SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_KEY ?? '').trim()
  const urlPreview = url ? url.replace('https://', '').split('.')[0] : 'NOT_SET'

  // Test 1: Can Vercel make ANY outbound request?
  let externalFetch = 'not_tested'
  try {
    const r = await fetch('https://httpbin.org/get', { signal: AbortSignal.timeout(8000) })
    externalFetch = r.ok ? 'ok' : `http_${r.status}`
  } catch (e) {
    externalFetch = String(e)
  }

  // Test 2: Can we reach supabase.co domain at all?
  let supabaseRoot = 'not_tested'
  try {
    const r = await fetch('https://supabase.co', { signal: AbortSignal.timeout(8000) })
    supabaseRoot = r.ok ? 'ok' : `http_${r.status}`
  } catch (e) {
    supabaseRoot = String(e)
  }

  // Test 3: The actual project endpoint
  let projectFetch: unknown = 'not_tested'
  try {
    const r = await fetch(`${url}/rest/v1/rooms?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    })
    const text = await r.text()
    projectFetch = { httpStatus: r.status, body: text.slice(0, 200) }
  } catch (e) {
    const err = e as Error & { cause?: unknown }
    projectFetch = { error: String(e), cause: String(err.cause ?? '') }
  }

  return NextResponse.json({ urlPreview, externalFetch, supabaseRoot, projectFetch })
}
