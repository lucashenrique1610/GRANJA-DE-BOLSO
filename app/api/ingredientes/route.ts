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
            .from("ingredientes")
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
        const { id, nome, proteina, energia, calcio, fosforo, metionina, lisina, fibra, preco, estoque } = body

        const { data, error } = await supabaseAdmin
            .from("ingredientes")
            .upsert({
                id,
                user_id: user.id,
                nome,
                proteina,
                energia,
                calcio,
                fosforo,
                metionina,
                lisina,
                fibra,
                preco,
                estoque,
                updated_at: new Date().toISOString()
            }, { onConflict: "id" })
            .select()

        if (error) {
            console.error("[API/Ingredientes] Erro ao salvar ingrediente:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data[0])
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
