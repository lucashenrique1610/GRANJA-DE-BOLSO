import { supabaseAdmin } from "./supabase-admin"

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return null
  
  const token = authHeader.replace("Bearer ", "")

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error) {
    console.error("[AuthHelper] Falha ao verificar token:", error.message)
    return null
  }
  if (!user) {
    console.warn("[AuthHelper] Token válido mas usuário não encontrado")
    return null
  }
  return user
}
