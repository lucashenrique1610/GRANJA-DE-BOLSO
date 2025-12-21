import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return new NextResponse("User ID required", { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .single()

    if (error || !data) {
      return NextResponse.json({ active: false })
    }

    return NextResponse.json({ active: true, subscription: data })
  } catch (error) {
    return NextResponse.json({ active: false })
  }
}
