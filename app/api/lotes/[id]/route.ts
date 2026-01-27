import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const { quantidade, fornecedor, dataCompra, valorLote, valorAve, tipo, raca, femeas, machos } = body

    // Validation
    if (!id || !quantidade || !fornecedor || !dataCompra) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { error } = await supabase
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

    // Note: If the batch doesn't exist in DB (because it's only in localStorage), Supabase might return no error but 0 rows affected.
    // For this implementation, we assume success if no DB error occurs, to support the hybrid model where data might eventually sync.
    
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
