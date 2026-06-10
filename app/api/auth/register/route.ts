import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { z } from "zod"

// Schema de validação
const registerSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  data: z.object({
    nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  }).optional(),
})

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  console.log(`[AUTH-REGISTER-${requestId}] Iniciando tentativa de registro`)

  try {
    const body = await req.json()
    
    // Validação dos dados de entrada
    const result = registerSchema.safeParse(body)
    
    if (!result.success) {
      const errorMessage = result.error.errors[0].message
      console.warn(`[AUTH-REGISTER-${requestId}] Falha na validação: ${errorMessage}`)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { email, password, data: userData } = result.data
    console.log(`[AUTH-REGISTER-${requestId}] Dados validados para email: ${email}`)

    const supabase = getSupabaseServerClient()

    // MOCK FOR DEVELOPMENT
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
       console.warn(`[AUTH-REGISTER-${requestId}] Using MOCK register`)
       return NextResponse.json({
         user: {
           id: "123e4567-e89b-12d3-a456-426614174000",
           email: email,
           user_metadata: userData || { nome: "Usuário Teste" }
         },
         session: {
           access_token: "mock-access-token",
           refresh_token: "mock-refresh-token",
           user: {
             id: "123e4567-e89b-12d3-a456-426614174000",
             email: email,
             user_metadata: userData || { nome: "Usuário Teste" }
           }
         }
       })
    }
    
    // Tentativa de cadastro no Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData, // Metadados como nome
      }
    })

    if (error) {
      console.error(`[AUTH-REGISTER-${requestId}] Erro Supabase: ${error.message}`)
      
      // Tradução de erros comuns do Supabase
      let friendlyError = "Erro ao registrar usuário"
      if (error.message.includes("already registered") || error.message.includes("User already exists")) {
        friendlyError = "Este e-mail já está cadastrado no sistema"
      } else if (error.message.includes("Password should be")) {
        friendlyError = "A senha não atende aos requisitos de segurança"
      } else if (error.status === 429) {
        friendlyError = "Muitas tentativas. Tente novamente mais tarde."
      }

      return NextResponse.json({ error: friendlyError, originalError: error.message }, { status: 400 })
    }

    if (!data.user) {
      console.error(`[AUTH-REGISTER-${requestId}] Erro desconhecido: Usuário não retornado`)
      return NextResponse.json({ error: "Erro ao criar usuário. Tente novamente." }, { status: 500 })
    }

    // Se o usuário foi criado mas precisa de confirmação (email)
    if (data.user && !data.session) {
      console.log(`[AUTH-REGISTER-${requestId}] Usuário criado, aguardando confirmação de e-mail`)
      return NextResponse.json({ 
        success: true, 
        message: "Cadastro realizado! Verifique seu e-mail para confirmar a conta.",
        user: data.user 
      })
    }

    console.log(`[AUTH-REGISTER-${requestId}] Registro concluído com sucesso`)
    return NextResponse.json(data)

  } catch (e: any) {
    console.error(`[AUTH-REGISTER-${requestId}] Exceção não tratada: ${e.message}`)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
