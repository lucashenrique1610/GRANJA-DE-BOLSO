import { NextResponse } from "next/server"
import { supabaseAdmin } from "./supabase-admin"
import { getUserFromRequest } from "./auth-helper"

type AccessResult = 
  | { status: "granted"; user: any }
  | { status: "unauthorized" } // 401
  | { status: "forbidden"; message: string } // 403
  | { status: "not_found" } // 404
  | { status: "error"; message: string } // 500

/**
 * Verifica se o usuário autenticado tem permissão para acessar o recurso especificado.
 * Se o recurso pertencer a outro usuário, registra um log de auditoria e retorna status forbidden.
 */
export async function verifyResourceAccess(
  req: Request, 
  table: string, 
  resourceId?: string
): Promise<AccessResult> {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return { status: "unauthorized" }
    }

    // Se não houver resourceId, é uma operação de listagem ou criação, 
    // assumimos que o chamador filtrará pelo user.id (como é padrão).
    // O chamador é responsável por usar user.id nas queries subsequentes.
    if (!resourceId) {
      return { status: "granted", user }
    }

    // Verificar propriedade do recurso usando admin client (bypass RLS para ver se existe)
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("user_id")
      .eq("id", resourceId)
      .single()

    if (error || !data) {
      // Recurso não existe (ou erro DB). Tratamos como 404 para não vazar info,
      // a menos que seja erro de conexão.
      // Se realmente não existe, 404 é correto.
      return { status: "not_found" }
    }

    // Verificar se pertence ao usuário
    if (data.user_id !== user.id) {
      // VIOLAÇÃO DE ISOLAMENTO DETECTADA
      console.warn(`[SECURITY] User ${user.id} attempted to access ${table}:${resourceId} belonging to ${data.user_id}`)
      
      // Registrar no Audit Log
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "security_violation",
        entity: table,
        entity_id: resourceId,
        details: `Access denied: Resource belongs to another user.`,
        user_metadata: JSON.stringify({ ip: req.headers.get("x-forwarded-for") || "unknown" })
      })

      return { status: "forbidden", message: "Acesso negado: Este recurso não pertence à sua conta." }
    }

    return { status: "granted", user }
  } catch (e: any) {
    console.error("[SECURITY] Error verifying access:", e)
    return { status: "error", message: e.message }
  }
}

/**
 * Helper para responder com base no resultado de acesso
 */
export function handleAccessError(result: AccessResult) {
  switch (result.status) {
    case "unauthorized":
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    case "forbidden":
      return NextResponse.json({ error: result.message }, { status: 403 })
    case "not_found":
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    case "error":
      return NextResponse.json({ error: result.message }, { status: 500 })
    default:
      return null
  }
}
