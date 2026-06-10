import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(token)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
        return NextResponse.json({ error: "ID do backup não fornecido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("backups")
      .select("data, salt, iv, version")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Erro ao recuperar backup:", error)
      return NextResponse.json({ error: "Backup não encontrado" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
