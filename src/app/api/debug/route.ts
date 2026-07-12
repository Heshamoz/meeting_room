import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    return NextResponse.json({ status: 'missing_env' })
  }

  const h = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  }

  // Test 1: read rooms
  let readStatus = 0, readBody = ''
  try {
    const r = await fetch(`${url}/rest/v1/rooms?select=id,data`, { headers: h, cache: 'no-store' })
    readStatus = r.status
    readBody = await r.text()
  } catch (e) { readBody = String(e) }

  // Test 2: insert a test row then delete it
  const testId = `debug-test-${Date.now()}`
  let insertStatus = 0, insertBody = ''
  try {
    const r = await fetch(`${url}/rest/v1/rooms`, {
      method: 'POST',
      headers: { ...h, Prefer: 'return=representation' },
      body: JSON.stringify({ id: testId, data: { id: testId, name: 'debug-test' } }),
      cache: 'no-store',
    })
    insertStatus = r.status
    insertBody = await r.text()
    // cleanup
    if (r.ok) {
      await fetch(`${url}/rest/v1/rooms?id=eq.${testId}`, { method: 'DELETE', headers: h, cache: 'no-store' })
    }
  } catch (e) { insertBody = String(e) }

  const rooms = readStatus === 200 ? JSON.parse(readBody) : []

  return NextResponse.json({
    read: { status: readStatus, count: rooms.length, ids: rooms.map((r: {id:string}) => r.id) },
    insert_test: { status: insertStatus, body: insertBody.slice(0, 300) },
  })
}
