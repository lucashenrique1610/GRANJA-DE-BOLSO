import { NextResponse } from "next/server"
import { stripe, getStripePriceId } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    const { planId, email, userId } = await req.json()

    const priceId = getStripePriceId(planId)

    if (!priceId) {
      return new NextResponse("Plano inválido", { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=cancelled`,
      customer_email: email,
      metadata: {
        userId,
        planId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
}
