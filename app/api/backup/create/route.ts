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

    const body = await req.json()
    const { data, salt, iv, size, version, note } = body

    if (!data || !salt || !iv) {
        return NextResponse.json({ error: "Dados de backup incompletos" }, { status: 400 })
    }

    const { error } = await supabase
      .from("backups")
      .insert({
        user_id: user.id,
        data,
        salt,
        iv,
        size,
        version,
        note
      })

    if (error) {
      console.error("Erro ao criar backup:", error)
      return NextResponse.json({ error: "Falha ao salvar backup" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
