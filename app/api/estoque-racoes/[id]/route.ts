import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/auth-helper"
import { verifyResourceAccess, handleAccessError } from "@/lib/security"

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id
        const access = await verifyResourceAccess(req, "estoque_racoes", id)

        if (access.status !== "granted") {
            return handleAccessError(access)
        }

        const { error } = await supabaseAdmin
            .from("estoque_racoes")
            .delete()
            .eq("id", id)
            .eq("user_id", access.user.id)

        if (error) {
            console.error("[API/EstoqueRacoes] Erro ao deletar estoque:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
