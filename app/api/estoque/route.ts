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
      .from("estoque")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, return default
        return NextResponse.json({
          user_id: user.id,
          ovos: 0,
          galinhas_vivas: 0,
          galinhas_limpas: 0,
          cama_aves: 0
        })
      }
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
    const { ovos, galinhasVivas, galinhasLimpas, camaAves } = body

    const { error } = await supabaseAdmin
      .from("estoque")
      .upsert({
        user_id: user.id,
        ovos,
        galinhas_vivas: galinhasVivas,
        galinhas_limpas: galinhasLimpas,
        cama_aves: camaAves
      }, { onConflict: "user_id" })

    if (error) {
      console.error("[API/Estoque] Erro ao salvar estoque:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
