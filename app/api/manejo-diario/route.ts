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
      .from("manejo_diario")
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
    const { id, data, periodo, loteId, status, ovos, ovosDanificados, racao, agua, porta, outros, pesoOvos, classificacao } = body

    const { error } = await supabaseAdmin
      .from("manejo_diario")
      .upsert({
        id,
        user_id: user.id,
        data,
        periodo,
        lote_id: loteId,
        status,
        ovos,
        ovos_danificados: ovosDanificados,
        racao,
        agua,
        porta,
        outros,
        peso_ovos: pesoOvos,
        classificacao
      }, { onConflict: "user_id, data, periodo, lote_id" })

    if (error) {
      console.error("[API/Manejo] Erro ao salvar manejo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
