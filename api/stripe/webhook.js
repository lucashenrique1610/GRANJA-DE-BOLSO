import {
  clearSubscriptionForUser,
  ensureBillingServerConfiguration,
  getStripeClient,
  readRawBody,
  upsertSubscriptionFromStripeSubscription,
} from '../../server/billing-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  const configurationError = ensureBillingServerConfiguration();
  if (configurationError) {
    res.status(configurationError.status).json(configurationError.payload);
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(503).json({
      error: 'Webhook indisponivel no servidor. Configure STRIPE_WEBHOOK_SECRET.',
    });
    return;
  }

  try {
    const stripe = getStripeClient();
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: 'Assinatura do webhook ausente.' });
      return;
    }

    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ['items.data.price'],
          });
          await upsertSubscriptionFromStripeSubscription(
            subscription,
            session.client_reference_id || session.metadata?.user_id || null,
          );
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await upsertSubscriptionFromStripeSubscription(event.data.object);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await clearSubscriptionForUser({
          userId: subscription.metadata?.user_id || null,
          stripeCustomerId:
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer?.id || null,
          stripeSubscriptionId: subscription.id,
        });
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ['items.data.price'],
          });
          await upsertSubscriptionFromStripeSubscription(subscription);
        }
        break;
      }
      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook Stripe:', error);
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : 'Falha ao processar o webhook da Stripe.',
    });
  }
}
