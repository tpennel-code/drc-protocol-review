import { NextResponse } from 'next/server'

// Supabase pauses free-tier projects after ~7 days of inactivity. This cron
// pings the Supabase REST API once a day so the project registers activity and
// stays awake. It replaces the old GitHub Actions workflow, which GitHub
// auto-disables after 60 days of repo inactivity.
//
// Wired up as a Vercel Cron Job in vercel.json. It queries Supabase directly
// with the publishable anon key (the same values that ship to the browser), so
// it needs no privileged credentials and is unaffected by Deployment Protection.

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel adds this header to cron invocations when CRON_SECRET is set. If the
  // secret is configured, reject anything that doesn't present it. The endpoint
  // is otherwise harmless (a single `select id limit 1`), so it works without.
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Supabase env not configured' },
      { status: 500 },
    )
  }

  const res = await fetch(`${url}/rest/v1/protocols?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json(
      { ok: false, status: res.status, body: body.slice(0, 500) },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}
