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

    // Update auth user metadata
    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      console.error("Error updating auth user:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Profiles table is not currently used/created in migration, 
    // so we rely solely on user_metadata for now.
    
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("API update error:", e)
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
  }
}
