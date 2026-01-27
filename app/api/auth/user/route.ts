import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      // console.warn("[AUTH-USER] Token não fornecido") // Opcional, pode ser spam
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // MOCK FOR DEVELOPMENT WITHOUT SUPABASE
    if (token === "mock-access-token") {
       return NextResponse.json({ 
         user: {
           id: "mock-user-id",
           email: "teste@exemplo.com",
           user_metadata: { nome: "Usuário Teste", telefone: "999999999" }
         } 
       })
    }

    const supabase = getSupabaseServerClient(token)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.warn(`[AUTH-USER] Token inválido ou expirado: ${error.message}`)
      return NextResponse.json({ user: null }, { status: 401 })
    }

    if (!user) {
      console.warn(`[AUTH-USER] Usuário não encontrado para o token fornecido`)
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (e: any) {
    console.error(`[AUTH-USER] Erro ao validar sessão: ${e.message}`)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
