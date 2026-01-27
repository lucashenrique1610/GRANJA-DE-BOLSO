import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return new NextResponse("User ID required", { status: 400 })
  }

  if (userId === "123e4567-e89b-12d3-a456-426614174000" || userId === "mock-user-id") {
    console.log(`[SUBSCRIPTION-CHECK] Mock user ${userId} detected, returning active subscription`)
    return NextResponse.json({ 
      active: true, 
      subscription: {
        id: "mock-subscription-id",
        user_id: userId,
        status: "active",
        plan_id: "pro",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      } 
    })
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
      console.log(`[SUBSCRIPTION-CHECK] Found existing subscription for ${userId}: ${existing.status}`)
      return NextResponse.json({ active: true, subscription: existing })
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !userData || !userData.user) {
      console.error(`[SUBSCRIPTION-CHECK] Error fetching user ${userId}:`, userError)
      return NextResponse.json({ active: false })
    }

    const createdAt = userData.user.created_at ? new Date(userData.user.created_at) : null
    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      console.error(`[SUBSCRIPTION-CHECK] Invalid created_at for user ${userId}`)
      return NextResponse.json({ active: false })
    }

    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    console.log(`[SUBSCRIPTION-CHECK] User ${userId} created ${diffDays.toFixed(2)} days ago`)

    if (diffDays >= 7) {
      console.log(`[SUBSCRIPTION-CHECK] User ${userId} ineligible for trial`)
      return NextResponse.json({ active: false })
    }

    const trialStart = createdAt.toISOString()
    const trialEndDate = new Date(createdAt)
    trialEndDate.setDate(trialEndDate.getDate() + 7)
    const trialEnd = trialEndDate.toISOString()

    console.log(`[SUBSCRIPTION-CHECK] Creating trial for ${userId} until ${trialEnd}`)

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
      console.error(`[SUBSCRIPTION-CHECK] Failed to create trial for ${userId}:`, trialError)
      return NextResponse.json({ active: false })
    }

    console.log(`[SUBSCRIPTION-CHECK] Trial created successfully for ${userId}`)
    return NextResponse.json({ active: true, subscription: trialData })
  } catch (error) {
    console.error(`[SUBSCRIPTION-CHECK] Internal error for ${userId}:`, error)
    return NextResponse.json({ active: false })
  }
}
