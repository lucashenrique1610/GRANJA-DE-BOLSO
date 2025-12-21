import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")
    const body = await req.json()
    
    // Support both `data` (profile updates) and direct attributes like `password`
    const { data: updateData, password } = body

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(token)
    
    const updates: any = {}
    if (updateData) updates.data = updateData
    if (password) updates.password = password

    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // If name/phone were updated, also update profiles table
    if (updateData && (updateData.nome || updateData.telefone)) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
             await supabase.from("profiles").upsert({
                id: user.id,
                nome: updateData.nome,
                telefone: updateData.telefone
            })
        }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
