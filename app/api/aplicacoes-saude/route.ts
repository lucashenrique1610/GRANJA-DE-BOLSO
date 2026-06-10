import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/auth-helper"

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("aplicacoes_saude")
      .select("*")
      .eq("user_id", user.id)

    if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, data, loteId, fase, tipo, nome, veterinario, quantidade, observacoes, proximaDose, dataProxima, formulacaoId } = body

    const { error } = await supabaseAdmin
      .from("aplicacoes_saude")
      .insert({
        id,
        user_id: user.id,
        data,
        lote_id: loteId,
        fase,
        tipo,
        nome,
        veterinario,
        quantidade,
        observacoes,
        proxima_dose: proximaDose,
        data_proxima: dataProxima,
        formulacao_id: formulacaoId
      })

    if (error) {
      console.error("[API/Aplicacoes-Saude] Erro ao salvar aplicacao:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
