import { withAuth } from '../../server/auth.js';
import { getPublicBillingPlans } from '../../server/billing-config.js';
import {
  deriveAccessState,
  getStripeClient,
  getSubscriptionRowForUser,
  normalizeSubscriptionRecord,
  serializeSubscriptionRecord,
} from '../../server/billing-store.js';

export default withAuth(async function handler(req, res, authResult) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  try {
    let subscriptionRow = null;

    try {
      subscriptionRow = await getSubscriptionRowForUser(
        authResult.requestClient,
        authResult.user.id,
      );
    } catch (error) {
      console.warn('Tabela de assinaturas ainda indisponivel:', error);
    }

    const stripe = getStripeClient();

    if (stripe && subscriptionRow?.stripe_subscription_id) {
      try {
        const liveSubscription = await stripe.subscriptions.retrieve(
          subscriptionRow.stripe_subscription_id,
          { expand: ['items.data.price'] },
        );

        subscriptionRow = {
          ...subscriptionRow,
          status: liveSubscription.status,
          stripe_price_id: liveSubscription.items?.data?.[0]?.price?.id || subscriptionRow.stripe_price_id,
          current_period_start: liveSubscription.current_period_start
            ? new Date(liveSubscription.current_period_start * 1000).toISOString()
            : subscriptionRow.current_period_start,
          current_period_end: liveSubscription.current_period_end
            ? new Date(liveSubscription.current_period_end * 1000).toISOString()
            : subscriptionRow.current_period_end,
          cancel_at_period_end: Boolean(liveSubscription.cancel_at_period_end),
          canceled_at: liveSubscription.canceled_at
            ? new Date(liveSubscription.canceled_at * 1000).toISOString()
            : subscriptionRow.canceled_at,
          updated_at: new Date().toISOString(),
        };
      } catch (error) {
        console.warn('Nao foi possivel atualizar o status ao vivo da Stripe:', error);
      }
    }

    const normalizedSubscriptionRow = normalizeSubscriptionRecord(subscriptionRow);

    res.status(200).json({
      plans: getPublicBillingPlans(),
      subscription: serializeSubscriptionRecord(normalizedSubscriptionRow),
      access: deriveAccessState(normalizedSubscriptionRow, authResult.profile),
      portalAvailable: Boolean(
        normalizedSubscriptionRow?.stripe_customer_id && process.env.STRIPE_SECRET_KEY,
      ),
      billingConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    });
  } catch (error) {
    console.error('Erro ao carregar status da assinatura:', error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Falha ao carregar o status da assinatura.',
    });
  }
});
