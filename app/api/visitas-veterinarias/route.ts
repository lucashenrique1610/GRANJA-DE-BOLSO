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
      .from("visitas_veterinarias")
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
    console.log("[API/Visitas-Veterinarias] POST request body:", body)
    
    const { lote_id, data, tipo_procedimento, veterinario, observacoes } = body

    const { data: insertResult, error } = await supabaseAdmin
      .from("visitas_veterinarias")
      .insert({
        user_id: user.id,
        lote_id,
        data,
        tipo_procedimento,
        veterinario,
        observacoes
      })
      .select()

    if (error) {
      console.error("[API/Visitas] Erro ao salvar visita:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API/Visitas-Veterinarias] Visita salva com sucesso:", insertResult)
    return NextResponse.json({ success: true, data: insertResult })
  } catch (e: any) {
    console.error("[API/Visitas-Veterinarias] Erro no POST:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
