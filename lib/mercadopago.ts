import { MercadoPagoConfig } from "mercadopago"

// Inicializa o cliente do Mercado Pago
// Se não houver token configurado, não inicializa (evita erro em build time se env não estiver setada)
export const mercadopago = process.env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    })
  : null
