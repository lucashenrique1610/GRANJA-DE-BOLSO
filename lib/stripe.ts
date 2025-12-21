import Stripe from "stripe"

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia", // Use latest API version or safe default
      typescript: true,
    })
  : ({} as Stripe)

export const getStripePriceId = (planId: string) => {
  switch (planId) {
    case "mensal":
      return process.env.STRIPE_PRICE_ID_MENSAL
    case "trimestral":
      return process.env.STRIPE_PRICE_ID_TRIMESTRAL
    case "semestral":
      return process.env.STRIPE_PRICE_ID_SEMESTRAL
    default:
      return null
  }
}
