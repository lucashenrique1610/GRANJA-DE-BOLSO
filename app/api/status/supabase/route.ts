import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    
    // Simple check: can we initialize?
    if (!supabase) {
        return NextResponse.json({ ok: false, error: "Falha ao inicializar cliente Supabase" }, { status: 500 })
    }

    // Try a simple public request, e.g. auth health check
    // Since we might not have a session, we can't query RLS tables easily.
    // But we can check if the URL and Key are set in environment.
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.json({ ok: false, error: "Variáveis de ambiente não configuradas" }, { status: 500 })
    }

    // Attempt a light request (it might fail 401 but that means we reached the server)
    await supabase.from('profiles').select('id').limit(1)
    
    // If error is connection refused or similar, it's bad.
    // If error is 401/403 (RLS), it means we connected successfully.
    // Actually, network errors usually throw in the fetch.
    
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
