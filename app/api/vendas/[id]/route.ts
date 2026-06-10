import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { verifyResourceAccess, handleAccessError } from "@/lib/security"

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id
        const access = await verifyResourceAccess(req, "vendas", id)

        if (access.status !== "granted") {
            return handleAccessError(access)
        }

        const { error } = await supabaseAdmin
            .from("vendas")
            .delete()
            .eq("id", id)
            .eq("user_id", access.user.id)

        if (error) {
            console.error("[API/Vendas] Erro ao deletar venda:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
