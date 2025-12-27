import { NextResponse } from "next/server"
import { Preference } from "mercadopago"
import { mercadopago } from "@/lib/mercadopago"

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  try {
    if (!mercadopago) {
      console.error(`[MP-PREF-${requestId}] Token não configurado`)
      return new NextResponse("Mercado Pago não configurado", { status: 500 })
    }

    const body = await req.json()
    const { items, payer, external_reference, planId } = body

    console.log(`[MP-PREF-${requestId}] Criando preferência:`, {
        email: payer?.email,
        ref: external_reference,
        plan: planId,
        itemsCount: items?.length
    })

    const preference = new Preference(mercadopago)

    const result = await preference.create({
      body: {
        items: items, 
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

    console.log(`[MP-PREF-${requestId}] Preferência criada: ${result.id}`)

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    })
  } catch (error: any) {
    console.error(`[MP-PREF-${requestId}] Erro:`, error)
    if (error.cause) {
        console.error(`[MP-PREF-${requestId}] Detalhes:`, JSON.stringify(error.cause, null, 2))
    }
    return new NextResponse("Erro ao criar preferência", { status: 500 })
  }
}
