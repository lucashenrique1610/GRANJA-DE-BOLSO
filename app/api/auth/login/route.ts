import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
})

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  console.log(`[AUTH-LOGIN-${requestId}] Iniciando tentativa de login`)

  try {
    const body = await req.json()
    
    // Validação
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      console.warn(`[AUTH-LOGIN-${requestId}] Dados inválidos: ${result.error.errors[0].message}`)
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { email, password } = result.data
    console.log(`[AUTH-LOGIN-${requestId}] Tentando autenticar: ${email}`)

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error(`[AUTH-LOGIN-${requestId}] Falha na autenticação: ${error.message}`)
      
      let friendlyError = "Falha ao realizar login"
      if (error.message.includes("Invalid login credentials")) {
        friendlyError = "E-mail ou senha incorretos"
      } else if (error.message.includes("Email not confirmed")) {
        friendlyError = "E-mail não confirmado. Verifique sua caixa de entrada."
      }

      return NextResponse.json({ error: friendlyError }, { status: 401 })
    }

    console.log(`[AUTH-LOGIN-${requestId}] Login realizado com sucesso para: ${data.user?.id}`)
    return NextResponse.json(data)
    
  } catch (e: any) {
    console.error(`[AUTH-LOGIN-${requestId}] Erro crítico: ${e.message}`)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
