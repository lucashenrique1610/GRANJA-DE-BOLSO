import { NextResponse } from "next/server"
import { Payment } from "mercadopago"
import { mercadopago } from "@/lib/mercadopago"
import { supabaseAdmin } from "@/lib/supabase-admin"

const subscriptionPlans = [
  { id: "mensal", price: 20 },
  { id: "trimestral", price: 54 },
  { id: "semestral", price: 96 },
]

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  try {
    if (!mercadopago) {
      console.error(`[MP-PIX-${requestId}] Mercado Pago não configurado (Token ausente)`)
      return new NextResponse("Mercado Pago não configurado", { status: 500 })
    }

    const body = await req.json()
    const { email, userId, planId } = body

    if (!email || !userId || !planId) {
      console.warn(`[MP-PIX-${requestId}] Dados obrigatórios faltando`)
      return new NextResponse("Dados incompletos", { status: 400 })
    }

    // Validar e calcular valor baseado no plano (backend authority)
    const plan = subscriptionPlans.find(p => p.id === planId)
    if (!plan) {
      return new NextResponse("Plano inválido", { status: 400 })
    }
    const amount = plan.price

    const payment = new Payment(mercadopago)
    
    // Configurar URL de notificação (Webhook)
    // Em localhost, webhooks do MP não funcionam diretamente sem tunnel (ngrok).
    // O sistema dependerá do fluxo de confirmação manual ou polling.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.1.1") || baseUrl.includes("127.0.0.1")
    const notificationUrl = isLocalhost ? undefined : `${baseUrl}/api/mercadopago/webhook`

    const paymentData = {
      body: {
        transaction_amount: Number(amount),
        description: `Assinatura ${planId} - Granja Bolso`,
        payment_method_id: "pix",
        payer: {
          email: email,
        },
        metadata: {
          plan_id: planId,
          user_id: userId
        },
        external_reference: userId,
        notification_url: notificationUrl,
      },
    }

    const result = await payment.create(paymentData)
    
    // Persistir transação no Supabase (se a tabela existir)
    try {
      if (supabaseAdmin) {
        await supabaseAdmin.from('pix_transactions').insert({
          mercadopago_id: result.id?.toString(),
          user_id: userId,
          amount: amount,
          status: result.status || 'pending',
          qr_code: result.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
          ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
          plan_id: planId
        })
      }
    } catch (dbError) {
      console.error(`[MP-PIX-${requestId}] Erro ao salvar transação no DB:`, dbError)
      // Não falhar o request se o log no DB falhar, pois o PIX foi gerado
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
    })
  } catch (error: any) {
    console.error(`[MP-PIX-${requestId}] Erro:`, error)
    return NextResponse.json(
      { error: "Erro ao criar pagamento PIX", details: error.message, more_info: error.cause?.description || "" },
      { status: 500 }
    )
  }
}
