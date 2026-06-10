import { NextResponse } from "next/server"
import { Payment } from "mercadopago"
import { mercadopago } from "@/lib/mercadopago"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    let topic = url.searchParams.get("topic") || url.searchParams.get("type")
    let id = url.searchParams.get("id") || url.searchParams.get("data.id")

    // Tentar ler do corpo se não estiver na URL (comum em notificações do MP)
    if (!id || !topic) {
        try {
            const body = await req.json()
            topic = body.type || body.topic || topic
            id = body.data?.id || body.id || id
        } catch {}
    }

    if (!mercadopago) {
        return new NextResponse("Mercado Pago não configurado", { status: 500 })
    }

    // Processar apenas pagamentos
    if (topic === "payment" && id) {
      const paymentClient = new Payment(mercadopago)
      const payment = await paymentClient.get({ id: id })

      if (payment.status === "approved") {
        const userId = payment.external_reference
        const metadata = payment.metadata as any
        const planId = metadata?.plan_id || "mensal"

        if (userId) {
            // Calcular duração com base no plano
            const startDate = new Date()
            const endDate = new Date()
            
            if (planId === "trimestral") {
                endDate.setMonth(endDate.getMonth() + 3)
            } else if (planId === "semestral") {
                endDate.setMonth(endDate.getMonth() + 6)
            } else {
                // Mensal ou default
                endDate.setMonth(endDate.getMonth() + 1)
            }

            await supabaseAdmin.from("subscriptions").upsert({
                id: `mp_${payment.id}`,
                user_id: userId,
                status: "active",
                current_period_start: startDate.toISOString(),
                current_period_end: endDate.toISOString(),
                metadata: {
                  method: "pix",
                  plan_id: planId,
                  payment_id: payment.id
                }
            })
            
            console.log(`Assinatura ativada para usuário ${userId} via Webhook MP`)
        }
      }
    }

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("[MERCADOPAGO_WEBHOOK]", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
}
