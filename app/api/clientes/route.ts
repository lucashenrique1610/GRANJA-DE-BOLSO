import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/auth-helper"
import { verifyResourceAccess, handleAccessError } from "@/lib/security"

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Usando supabaseAdmin (bypass RLS) mas filtrando explicitamente por user_id
    const { data, error } = await supabaseAdmin
      .from("clientes")
      .select("id, nome, endereco, telefone, cpf_cnpj, tipo")
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
    const { id, nome, endereco, telefone, cpf_cnpj, tipo } = body

    // Se ID fornecido, verificar isolamento antes do Upsert
    if (id) {
      const access = await verifyResourceAccess(req, "clientes", id)
      // Se proibido, retorna erro. Se não encontrado (novo) ou permitido (meu), prossegue.
      if (access.status === "forbidden") {
        return handleAccessError(access)
      }
    }

    const { error } = await supabaseAdmin
      .from("clientes")
      .upsert({
        id, // Use ID se fornecido
        user_id: user.id, // Força ownership
        nome,
        endereco,
        telefone,
        cpf_cnpj: cpf_cnpj || null,
        tipo,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
