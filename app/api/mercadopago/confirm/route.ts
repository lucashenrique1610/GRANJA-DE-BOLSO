import { NextResponse } from "next/server"
import { Payment } from "mercadopago"
import { mercadopago } from "@/lib/mercadopago"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  try {
    if (!mercadopago) {
      return new NextResponse("Mercado Pago não configurado", { status: 500 })
    }
    const body = await req.json()
    const { paymentId } = body
    if (!paymentId) {
      return new NextResponse("ID de pagamento ausente", { status: 400 })
    }
    const paymentClient = new Payment(mercadopago)
    const payment = await paymentClient.get({ id: paymentId })
    
    // Atualizar status na tabela de transações (se existir)
    try {
      if (supabaseAdmin) {
        await supabaseAdmin.from('pix_transactions')
          .update({ 
            status: payment.status, 
            updated_at: new Date().toISOString() 
          })
          .eq('mercadopago_id', paymentId.toString())
      }
    } catch (e) {
      console.error("Erro ao atualizar transação:", e)
    }

    if (payment.status !== "approved") {
      return NextResponse.json({ confirmed: false, status: payment.status })
    }
    const userId = payment.external_reference
    const metadata = payment.metadata as any
    const planId = metadata?.plan_id || "mensal"
    const startDate = new Date()
    const endDate = new Date()
    if (planId === "trimestral") {
      endDate.setMonth(endDate.getMonth() + 3)
    } else if (planId === "semestral") {
      endDate.setMonth(endDate.getMonth() + 6)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }
    if (userId) {
      await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        status: "active",
        plan_id: planId,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString(),
        stripe_subscription_id: `mp_${payment.id}`
      })
    }
    return NextResponse.json({ confirmed: true, status: "approved" })
  } catch (error) {
    return new NextResponse("Erro interno", { status: 500 })
  }
}
