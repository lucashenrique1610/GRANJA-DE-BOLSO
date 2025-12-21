import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    )
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (event.type === "checkout.session.completed") {
    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    // Update the user status in your database.
    // userId should be passed in client_reference_id or metadata during checkout
    const userId = session.metadata?.userId || session.client_reference_id

    if (userId) {
      await supabaseAdmin.from("subscriptions").upsert({
        id: subscription.id,
        user_id: userId,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        quantity: 1,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created: new Date(subscription.created * 1000).toISOString(),
        metadata: subscription.metadata,
      })
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscriptionId = session.subscription as string
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    await supabaseAdmin.from("subscriptions").update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }).eq("id", subscriptionId)
  }

  if (event.type === "customer.subscription.updated") {
     const subscription = event.data.object as Stripe.Subscription
     await supabaseAdmin.from("subscriptions").upsert({
        id: subscription.id,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
     })
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    await supabaseAdmin.from("subscriptions").update({
      status: subscription.status,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString(),
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : new Date().toISOString(),
    }).eq("id", subscription.id)
  }

  return new NextResponse(null, { status: 200 })
}
