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
      .order("created", { ascending: false })
      .limit(1)

    const existing = !error && Array.isArray(data) && data.length > 0 ? data[0] : null

    if (existing) {
      return NextResponse.json({ active: true, subscription: existing })
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !userData || !userData.user) {
      return NextResponse.json({ active: false })
    }

    const createdAt = userData.user.created_at ? new Date(userData.user.created_at) : null
    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      return NextResponse.json({ active: false })
    }

    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays >= 7) {
      return NextResponse.json({ active: false })
    }

    const trialStart = now.toISOString()
    const trialEndDate = new Date(now)
    trialEndDate.setDate(trialEndDate.getDate() + 7)
    const trialEnd = trialEndDate.toISOString()

    const { data: trialData, error: trialError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        id: `trial_${userId}`,
        user_id: userId,
        status: "trialing",
        quantity: 1,
        cancel_at_period_end: false,
        current_period_start: trialStart,
        current_period_end: trialEnd,
        trial_start: trialStart,
        trial_end: trialEnd,
        metadata: { source: "free_trial" },
      })
      .select("*")
      .single()

    if (trialError || !trialData) {
      return NextResponse.json({ active: false })
    }

    return NextResponse.json({ active: true, subscription: trialData })
  } catch (error) {
    return NextResponse.json({ active: false })
  }
}
