import { supabase } from '@/lib/supabase';

export type BillingPlanCode =
  | 'avicultor_monthly'
  | 'avicultor_quarterly'
  | 'avicultor_semiannual'
  | 'avicultor_annual'
  | 'avicultor_priority_monthly';

export interface BillingPlanView {
  code: BillingPlanCode;
  name: string;
  shortLabel: string;
  description: string;
  priceCents: number;
  equivalentMonthlyCents: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  discountPercent: number;
  badge: string;
  highlight: boolean;
  supportTier: 'standard' | 'priority';
  features: string[];
  priceDisplay: string;
  equivalentMonthlyDisplay: string;
  configured: boolean;
}

export interface SubscriptionStatusView {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  planCode: string;
  planName: string;
  status: string;
  billingInterval: string | null;
  billingIntervalCount: number | null;
  currency: string;
  amountCents: number | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialConsumedAt: string | null;
  trialOrigin: string | null;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
}

export interface BillingAccessView {
  hasAccess: boolean;
  shouldLockToSubscription: boolean;
  reason:
    | 'active_subscription'
    | 'legacy_access'
    | 'promoter_free_access'
    | 'trial_active'
    | 'trial_expired'
    | 'subscription_required'
    | 'entitlement_missing';
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  promoterEnabledAt: string | null;
}

export interface BillingStatusResponse {
  plans: BillingPlanView[];
  subscription: SubscriptionStatusView | null;
  access: BillingAccessView;
  portalAvailable: boolean;
  billingConfigured: boolean;
}

async function getAuthHeaders() {
  const session = supabase ? await supabase.auth.getSession() : null;
  const accessToken = session?.data.session?.access_token;

  if (!accessToken) {
    throw new Error('Sessão inválida ou expirada. Entre novamente para continuar.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : 'Falha ao processar a requisicao de assinatura.',
    );
  }

  return payload as T;
}

export async function fetchBillingStatus() {
  const response = await fetch('/api/billing/subscription-status', {
    headers: await getAuthHeaders(),
    credentials: 'same-origin',
  });

  return parseResponse<BillingStatusResponse>(response);
}

export async function createCheckoutSession(planCode: BillingPlanCode) {
  const response = await fetch('/api/billing/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
    },
    credentials: 'same-origin',
    body: JSON.stringify({ planCode }),
  });

  return parseResponse<{ url: string; sessionId: string }>(response);
}

export async function createPortalSession() {
  const response = await fetch('/api/billing/create-portal-session', {
    method: 'POST',
    headers: {
      ...(await getAuthHeaders()),
    },
    credentials: 'same-origin',
  });

  return parseResponse<{ url: string }>(response);
}
