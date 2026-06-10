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
    const { id, quantidade, fornecedor, dataCompra, valorLote, valorAve, tipo, raca, femeas, machos, nome, localizacao, finalidade, observacoes, documentos } = body

    const { error } = await supabaseAdmin
      .from("lotes")
      .insert({
        id,
        user_id: user.id,
        quantidade,
        fornecedor,
        data_compra: dataCompra,
        valor_lote: valorLote,
        valor_ave: valorAve,
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

    if (error) {
      console.error("[API/Lotes] Erro ao criar lote:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
