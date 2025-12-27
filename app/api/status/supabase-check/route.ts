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

    // Criar cliente isolado para teste
    const supabase = createClient(url, key, {
      auth: { persistSession: false }
    })

    // Teste 1: Verificar saúde da API Auth
    const authCheckStart = performance.now()
    const { data: authData, error: authError } = await supabase.auth.getSession()
    const authLatency = performance.now() - authCheckStart

    status.details.auth = {
      ok: !authError,
      latency: Math.round(authLatency),
      error: authError?.message
    }

    // Teste 2: Verificar acesso ao banco (tabela pública ou system table)
    // Tentamos listar usuários (requer service role) ou apenas um ping
    // Vamos tentar pegar o health do serviço se possível, ou uma query leve
    const dbCheckStart = performance.now()
    
    // Tentativa segura: contar usuários (requer admin, que temos)
    // Isso valida se a chave de serviço está funcionando e o banco responde
    const { count, error: dbError } = await supabase
      .from('profiles') // Tabela que deve existir
      .select('*', { count: 'exact', head: true })
      
    const dbLatency = performance.now() - dbCheckStart

    status.details.db = {
      ok: !dbError,
      latency: Math.round(dbLatency),
      error: dbError?.message
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
