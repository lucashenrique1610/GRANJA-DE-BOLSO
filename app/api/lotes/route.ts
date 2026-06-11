import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/auth-helper"
import { verifyResourceAccess, handleAccessError } from "@/lib/security"

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("lotes")
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
    console.log("[API/Lotes] POST request body:", body)

    const { quantidade, fornecedor, data_compra, valor_lote, valor_ave, tipo, raca, femeas, machos, nome, localizacao, finalidade, observacoes, documentos } = body

    const { data, error } = await supabaseAdmin
      .from("lotes")
      .insert({
        user_id: user.id,
        quantidade,
        fornecedor,
        data_compra,
        valor_lote,
        valor_ave,
        tipo,
        raca,
        femeas,
        machos,
        nome,
        localizacao,
        finalidade,
        observacoes,
        documentos
      })
      .select()

    if (error) {
      console.error("[API/Lotes] Erro ao criar lote:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API/Lotes] Lote criado com sucesso:", data)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error("[API/Lotes] Erro no POST:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
