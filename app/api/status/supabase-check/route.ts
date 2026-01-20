import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  const start = performance.now()
  const status = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    connection: false,
    latency: 0,
    error: null as string | null,
    details: {} as any
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error("Variáveis de ambiente do Supabase ausentes")
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false }
    })

    const authCheckStart = performance.now()
    const { error: authError } = await supabase.auth.getSession()
    const authLatency = performance.now() - authCheckStart

    status.details.auth = {
      ok: !authError,
      latency: Math.round(authLatency),
      error: authError?.message
    }

    const dbCheckStart = performance.now()
    
    const { error: dbError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      
    const dbLatency = performance.now() - dbCheckStart

    status.details.db = {
      ok: !dbError,
      latency: Math.round(dbLatency),
      error: dbError?.message
    }

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && anonKey) {
      const anon = createClient(url, anonKey, { auth: { persistSession: false } })
      const anonProfilesStart = performance.now()
      const { error: anonProfilesError } = await anon.from("profiles").select("id").limit(1)
      const anonProfilesLatency = performance.now() - anonProfilesStart
      status.details.anon_profiles = {
        ok: !anonProfilesError,
        latency: Math.round(anonProfilesLatency),
        error: anonProfilesError?.message
      }
      const anonBackupsStart = performance.now()
      const { error: anonBackupsError } = await anon.from("backups").select("id").limit(1)
      const anonBackupsLatency = performance.now() - anonBackupsStart
      status.details.anon_backups = {
        ok: !anonBackupsError,
        latency: Math.round(anonBackupsLatency),
        error: anonBackupsError?.message
      }
    }

    if (authError || dbError) {
      throw new Error(authError?.message || dbError?.message || "Erro desconhecido")
    }

    status.connection = true
    status.latency = Math.round(performance.now() - start)

    return NextResponse.json(status)

  } catch (e: any) {
    status.error = e.message
    status.latency = Math.round(performance.now() - start)
    console.error("[SUPABASE-DIAGNOSTIC]", e)
    return NextResponse.json(status, { status: 500 })
  }
}
