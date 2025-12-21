import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
        return NextResponse.json({ success: true }) // Already logged out effectively
    }

    const supabase = getSupabaseServerClient(token)
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
