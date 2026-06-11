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
      .from("mortalidade")
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
    console.log("[API/Mortalidade] POST request body:", body)
    
    const { data, lote_id, quantidade, causa, observacoes } = body

    const { data: insertResult, error } = await supabaseAdmin
      .from("mortalidade")
      .insert({
        user_id: user.id,
        data,
        lote_id,
        quantidade,
        causa,
        observacoes
      })
      .select()

    if (error) {
      console.error("[API/Mortalidade] Erro ao salvar mortalidade:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API/Mortalidade] Mortalidade salva com sucesso:", insertResult)
    return NextResponse.json({ success: true, data: insertResult })
  } catch (e: any) {
    console.error("[API/Mortalidade] Erro no POST:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
