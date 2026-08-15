import { withAuth } from '../../server/auth.js';
import { withObservability } from '../../server/observability.js';
import { resolveConfiguredPlan } from '../../server/billing-config.js';
import {
  ensureBillingServerConfiguration,
  getBaseUrl,
  getOrCreateStripeCustomer,
  getStripeClient,
  readJsonBody,
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
      const body = await readJsonBody(req);
      const plan = resolveConfiguredPlan(body.planCode);

      if (!plan) {
        res.status(400).json({ error: 'Plano de assinatura invalido.' });
        return;
      }

      if (!plan.configured || !plan.priceId) {
        res.status(409).json({
          error: 'Este plano ainda nao foi configurado na Stripe. Cadastre o price_id antes de ativar a cobranca.',
        });
        return;
      }

      const stripe = getStripeClient();
      const customerId = await getOrCreateStripeCustomer({
        userId: authResult.user.id,
        email: authResult.user.email || authResult.profile?.email || '',
        fullName: authResult.profile?.full_name || '',
      });

      const baseUrl = getBaseUrl(req);
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        client_reference_id: authResult.user.id,
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/?billing=success`,
        cancel_url: `${baseUrl}/?billing=cancelled`,
        metadata: {
          user_id: authResult.user.id,
          plan_code: plan.code,
        },
        subscription_data: {
          metadata: {
            user_id: authResult.user.id,
            plan_code: plan.code,
          },
        },
        billing_address_collection: 'auto',
        allow_promotion_codes: false,
        locale: 'pt-BR',
      });

      ctx.info('billing.checkout.created', { planCode: plan.code, sessionId: checkoutSession.id });
      res.status(200).json({
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
        requestId: ctx.requestId,
      });
    } catch (error) {
      ctx.error('billing.checkout.failed', error, { planCode: body?.planCode ?? null });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Falha ao iniciar o checkout da assinatura.',
        requestId: ctx.requestId,
      });
    }
  }),
);