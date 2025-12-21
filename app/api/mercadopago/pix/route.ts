import { NextResponse } from "next/server"
import { Payment } from "mercadopago"
import { mercadopago } from "@/lib/mercadopago"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    if (!mercadopago) {
      return new NextResponse("Mercado Pago não configurado", { status: 500 })
    }

    const { amount, description, email, userId, planId } = await req.json()

    const payment = new Payment(mercadopago)

    const paymentData = {
      body: {
        transaction_amount: Number(amount),
        description: description,
        payment_method_id: "pix",
        payer: {
          email: email,
        },
        metadata: {
          plan_id: planId
        },
        external_reference: userId, // Para identificar o usuário no webhook
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mercadopago/webhook`,
      },
    }

    const result = await payment.create(paymentData)

    // Salvar referência do pagamento no Supabase (opcional, para controle)
    // Se tivermos tabela de transações. Se não, confiamos no external_reference do Webhook.

    return NextResponse.json({
      id: result.id,
      status: result.status,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
    })
  } catch (error) {
    console.error("[MERCADOPAGO_PIX]", error)
    return new NextResponse("Erro ao criar pagamento PIX", { status: 500 })
  }
}
