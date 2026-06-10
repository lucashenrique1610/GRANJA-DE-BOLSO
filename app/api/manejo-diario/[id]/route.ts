import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { verifyResourceAccess, handleAccessError } from "@/lib/security"

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id
        const access = await verifyResourceAccess(req, "manejo_diario", id)

        if (access.status !== "granted") {
            return handleAccessError(access)
        }

        const { error } = await supabaseAdmin
            .from("manejo_diario")
            .delete()
            .eq("id", id)
            .eq("user_id", access.user.id)

        if (error) {
            console.error("[API/ManejoDiario] Erro ao deletar manejo:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
