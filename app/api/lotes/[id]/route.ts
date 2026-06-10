import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { verifyResourceAccess, handleAccessError } from "@/lib/security"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    // 1. Verificar Isolamento e Autorização
    const access = await verifyResourceAccess(request, "lotes", id)
    if (access.status !== "granted") {
        // Retorna 401, 403 ou 404 conforme apropriado
        return handleAccessError(access)
    }
    
    // Usuário autenticado e dono do recurso
    const body = await request.json()
    const { quantidade, fornecedor, dataCompra, valorLote, valorAve, tipo, raca, femeas, machos } = body

    // Validação básica
    if (!id || !quantidade || !fornecedor || !dataCompra) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // 2. Executar Update
    const { error } = await supabaseAdmin
      .from("lotes")
      .update({
        quantidade,
        fornecedor,
        data_compra: dataCompra,
        valor_lote: valorLote,
        valor_ave: valorAve,
        tipo,
        raca,
        femeas,
        machos,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      // Redundância de segurança: garantir que só atualiza se for do usuário
      .eq("user_id", access.user.id)

    if (error) {
      console.error("Erro ao atualizar lote no Supabase:", error)
      return NextResponse.json({ error: "Erro ao atualizar no banco de dados" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
