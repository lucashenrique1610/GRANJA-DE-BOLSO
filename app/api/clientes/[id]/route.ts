import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/auth-helper"
import { verifyResourceAccess, handleAccessError } from "@/lib/security"

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

    // Verificar acesso ao recurso
    const access = await verifyResourceAccess(req, "clientes", id)
    if (access.status !== "allowed") {
      return handleAccessError(access)
    }

    const { error } = await supabaseAdmin
      .from("clientes")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[API/Clientes] Erro ao deletar cliente:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
