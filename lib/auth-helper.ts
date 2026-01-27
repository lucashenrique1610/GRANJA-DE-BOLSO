import { supabaseAdmin } from "./supabase-admin"

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return null
  
  const token = authHeader.replace("Bearer ", "")

  // MOCK FOR DEVELOPMENT
  if (token === "mock-access-token") {
    return {
      id: "mock-user-id",
      email: "teste@exemplo.com",
      user_metadata: { nome: "Usuário Teste" }
    }
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) return null
  return user
}
