import { NextResponse } from "next/server"
import { Payment } from "mercadopago"
import { mercadopago } from "@/lib/mercadopago"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  try {
    if (!mercadopago) {
      console.error(`[MP-PIX-${requestId}] Mercado Pago não configurado (Token ausente)`)
      return new NextResponse("Mercado Pago não configurado", { status: 500 })
    }

    const body = await req.json()
    const { amount, description, email, userId, planId } = body

    console.log(`[MP-PIX-${requestId}] Iniciando pagamento PIX:`, {
      amount,
      email,
      userId,
      planId
    })

    if (!amount || !email || !userId) {
      console.warn(`[MP-PIX-${requestId}] Dados obrigatórios faltando`)
      return new NextResponse("Dados incompletos", { status: 400 })
    }

    const payment = new Payment(mercadopago)

    // URL base da aplicação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    
    // Verifica se é localhost para tratar notification_url
    // O Mercado Pago NÃO aceita localhost no notification_url
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")
    
    // Se for localhost, NÃO envia notification_url para evitar erro 400
    // Em produção, deve-se usar uma URL válida (ex: https://meusite.com/api/...)
    const notificationUrl = isLocalhost 
        ? undefined 
        : `${baseUrl}/api/mercadopago/webhook`

    const paymentData = {
      body: {
        transaction_amount: Number(amount),
        description: description || `Assinatura ${planId}`,
        payment_method_id: "pix",
        payer: {
          email: email,
        },
        metadata: {
          plan_id: planId
        },
        external_reference: userId,
        notification_url: notificationUrl,
      },
    }

    console.log(`[MP-PIX-${requestId}] Enviando para Mercado Pago...`)
    const result = await payment.create(paymentData)
    
    console.log(`[MP-PIX-${requestId}] Sucesso! ID: ${result.id}, Status: ${result.status}`)

    return NextResponse.json({
      id: result.id,
      status: result.status,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
    })
  } catch (error: any) {
    console.error(`[MP-PIX-${requestId}] Erro:`, error)
    if (error.cause) {
        console.error(`[MP-PIX-${requestId}] Causa Detalhada:`, JSON.stringify(error.cause, null, 2))
    }
    return new NextResponse("Erro ao criar pagamento PIX", { status: 500 })
  }
}
