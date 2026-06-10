import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(token)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { retentionDays } = await req.json()
    if (!retentionDays || retentionDays <= 0) {
        return NextResponse.json({ error: "Período de retenção inválido" }, { status: 400 })
    }

    const date = new Date()
    date.setDate(date.getDate() - retentionDays)
    const threshold = date.toISOString()

    const { error } = await supabase
      .from("backups")
      .delete()
      .eq("user_id", user.id)
      .lt("created_at", threshold)

    if (error) {
      console.error("Erro ao limpar backups:", error)
      return NextResponse.json({ error: "Falha ao limpar backups antigos" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
