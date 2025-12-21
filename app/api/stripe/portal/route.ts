import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    // 1. Find the Stripe Customer ID from Supabase
    // We assume the subscription table holds the record, and we can find the customer ID from the subscription object (if we stored it)
    // Or we query Stripe by email. But best practice is to store stripe_customer_id in a 'users' or 'customers' table.
    // For this implementation, we will try to find a subscription for the user and get the customer ID from it.
    
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id") // The ID in our table IS the Stripe Subscription ID
      .eq("user_id", userId)
      .single()

    if (!sub) {
        return new NextResponse("Assinatura não encontrada", { status: 404 })
    }

    // Retrieve subscription from Stripe to get Customer ID
    const stripeSub = await stripe.subscriptions.retrieve(sub.id)
    const customerId = stripeSub.customer as string

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[STRIPE_PORTAL]", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
}
