import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/auth-helper"
import { verifyResourceAccess, handleAccessError } from "@/lib/security"

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    console.log("[API/Lotes] PUT request body:", body)

    const { data, error } = await supabaseAdmin
      .from("lotes")
      .update({
        quantidade: body.quantidade,
        fornecedor: body.fornecedor,
        data_compra: body.data_compra,
        valor_lote: body.valor_lote,
        valor_ave: body.valor_ave,
        tipo: body.tipo,
        raca: body.raca,
        femeas: body.femeas,
        machos: body.machos,
        nome: body.nome,
        localizacao: body.localizacao,
        finalidade: body.finalidade,
        observacoes: body.observacoes,
        documentos: body.documentos
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()

    if (error) {
      console.error("[API/Lotes] Erro ao atualizar lote:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API/Lotes] Lote atualizado com sucesso:", data)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error("[API/Lotes] Erro no PUT:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const { error } = await supabaseAdmin
      .from("lotes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[API/Lotes] Erro ao deletar lote:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
