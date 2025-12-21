import { NextResponse } from "next/server"
import { Preference } from "mercadopago"
import { mercadopago } from "@/lib/mercadopago"

export async function POST(req: Request) {
  try {
    if (!mercadopago) {
      return new NextResponse("Mercado Pago não configurado", { status: 500 })
    }

    const { items, payer, external_reference, planId } = await req.json()

    const preference = new Preference(mercadopago)

    const result = await preference.create({
      body: {
        items: items, // [{ title: 'Assinatura', quantity: 1, unit_price: 100 }]
        payer: {
          email: payer.email,
          name: payer.name,
        },
        metadata: {
            plan_id: planId
        },
        external_reference: external_reference,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?status=success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mercadopago/webhook`,
      },
    })

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    })
  } catch (error) {
    console.error("[MERCADOPAGO_PREFERENCE]", error)
    return new NextResponse("Erro ao criar preferência", { status: 500 })
  }
}
