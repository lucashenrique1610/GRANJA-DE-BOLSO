import { supabase } from '@/lib/supabase';

export interface AdminAccessView {
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

export interface AdminSubscriptionView {
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

export interface AdminUserOverviewItem {
  id: string;
  createdAt: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  appRole: 'usuario' | 'moderador' | 'admin';
  isDivulgador: boolean;
  divulgadorEnabledAt: string | null;
  farm: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  } | null;
  subscription: AdminSubscriptionView | null;
  access: AdminAccessView;
}

export interface AdminUsersOverviewResponse {
  summary: {
    totalUsers: number;
    totalAdmins: number;
    totalDivulgadores: number;
    totalActiveSubscriptions: number;
    totalTrialActive: number;
  };
  users: AdminUserOverviewItem[];
}

async function getAuthHeaders() {
  const session = supabase ? await supabase.auth.getSession() : null;
  const accessToken = session?.data.session?.access_token;

  if (!accessToken) {
    throw new Error('Sessao invalida ou expirada. Entre novamente para continuar.');
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
        : 'Falha ao processar a requisicao administrativa.',
    );
  }

  return payload as T;
}

export async function fetchAdminUsersOverview() {
  const response = await fetch('/api/admin/users-overview', {
    headers: await getAuthHeaders(),
    credentials: 'same-origin',
  });

  return parseResponse<AdminUsersOverviewResponse>(response);
}

export async function updateUserPromoterAccess(userId: string, enabled: boolean, notes?: string) {
  const response = await fetch('/api/admin/promoter-access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
    },
    credentials: 'same-origin',
    body: JSON.stringify({ userId, enabled, notes: notes ?? null }),
  });

  return parseResponse<{ user: unknown; message: string }>(response);
}
