import { withAuth } from '../../server/auth.js';
import { withObservability } from '../../server/observability.js';
import {
  ensureBillingServerConfiguration,
  getBaseUrl,
  getStripeClient,
  getSubscriptionRowForUser,
  getSupabaseAdminClient,
} from '../../server/billing-store.js';

export default withObservability(
  withAuth(async function handler(req, res, authResult, ctx) {
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

    try {
      const stripe = getStripeClient();
      const adminClient = getSupabaseAdminClient();
      const subscriptionRow = await getSubscriptionRowForUser(adminClient, authResult.user.id);

      if (!subscriptionRow?.stripe_customer_id) {
        res.status(409).json({
          error: 'Nenhum cliente Stripe foi encontrado para esta conta. Assine um plano primeiro.',
        });
        return;
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscriptionRow.stripe_customer_id,
        return_url: `${getBaseUrl(req)}/?billing=portal-return`,
      });

      ctx.info('billing.portal.created', { customerId: subscriptionRow.stripe_customer_id });
      res.status(200).json({
        url: portalSession.url,
      });
    } catch (error) {
      ctx.error('billing.portal.failed', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Falha ao abrir o portal da assinatura.',
        requestId: ctx.requestId,
      });
    }
  }),
);