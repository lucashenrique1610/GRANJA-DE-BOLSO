import { apiFetch } from '@/lib/observability';
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

export async function fetchBillingStatus() {
  return apiFetch<BillingStatusResponse>('/api/billing/subscription-status', {
    headers: await getAuthHeaders(),
    credentials: 'same-origin',
    label: 'billing.subscription-status',
  });
}

export async function createCheckoutSession(planCode: BillingPlanCode) {
  return apiFetch<{ url: string; sessionId: string }>('/api/billing/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
    },
    credentials: 'same-origin',
    body: JSON.stringify({ planCode }),
    label: 'billing.create-checkout-session',
  });
}

export async function createPortalSession() {
  return apiFetch<{ url: string }>('/api/billing/create-portal-session', {
    method: 'POST',
    headers: {
      ...(await getAuthHeaders()),
    },
    credentials: 'same-origin',
    label: 'billing.create-portal-session',
  });
}
