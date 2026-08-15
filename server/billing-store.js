import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getBillingPlanByPriceId } from './billing-config.js';
import { instrumentSupabaseClient, Logger } from './observability.js';

function jsonResult(status, payload) {
  return { status, payload };
}

export function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
}

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || '';
}

export function getBaseUrl(req) {
  const configuredBaseUrl = process.env.APP_BASE_URL || process.env.VITE_APP_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

export function getStripeClient() {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey);
}

export function getSupabaseAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return instrumentSupabaseClient(
    createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    new Logger(),
  );
}

export function ensureBillingServerConfiguration() {
  if (!getStripeSecretKey()) {
    return jsonResult(503, {
      error: 'Cobrança indisponível no servidor. Configure STRIPE_SECRET_KEY.',
    });
  }

  if (!getSupabaseUrl() || !getSupabaseServiceRoleKey()) {
    return jsonResult(503, {
      error:
        'Cobrança indisponível no servidor. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  return null;
}

export async function readJsonBody(req) {
  const rawBody = await readRawBody(req);
  if (!rawBody.length) {
    return {};
  }

  try {
    return JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new Error('Corpo da requisição em JSON inválido.');
  }
}

export async function readRawBody(req) {
  if (req.body && Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body);
  }

  if (req.body && typeof req.body === 'object') {
    return Buffer.from(JSON.stringify(req.body));
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export async function getSubscriptionRowForUser(client, userId) {
  const { data, error } = await client
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getSubscriptionRowByStripeCustomerId(client, stripeCustomerId) {
  const { data, error } = await client
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getSubscriptionRowByStripeSubscriptionId(client, stripeSubscriptionId) {
  const { data, error } = await client
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function toIsoTimestamp(unixSeconds) {
  if (!unixSeconds) {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function getTimeOrNull(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePromoterProfile(profile) {
  if (!profile?.is_divulgador) {
    return null;
  }

  return {
    isDivulgador: true,
    enabledAt: profile.divulgador_enabled_at || null,
  };
}

export function normalizeSubscriptionRecord(row) {
  if (!row) {
    return null;
  }

  const trialEndsAtMs = getTimeOrNull(row.trial_ends_at);
  if (row.status === 'trialing' && trialEndsAtMs !== null && trialEndsAtMs <= Date.now()) {
    return {
      ...row,
      status: 'trial_expired',
    };
  }

  return row;
}

export function deriveAccessState(row, profile) {
  const normalizedRow = normalizeSubscriptionRecord(row);
  const promoterProfile = normalizePromoterProfile(profile);
  const nowMs = Date.now();
  const trialEndsAtMs = getTimeOrNull(normalizedRow?.trial_ends_at);
  const trialStartedAt = normalizedRow?.trial_started_at || null;
  const trialEndsAt = normalizedRow?.trial_ends_at || null;
  const promoterEnabledAt = promoterProfile?.enabledAt || null;
  const hasTrialWindow = trialEndsAtMs !== null;
  const trialIsActive =
    normalizedRow?.status === 'trialing' && trialEndsAtMs !== null && trialEndsAtMs > nowMs;
  const trialExpired =
    normalizedRow?.status === 'trial_expired' ||
    (hasTrialWindow && trialEndsAtMs !== null && trialEndsAtMs <= nowMs);
  const hasPaidAccess =
    normalizedRow?.status === 'active' || normalizedRow?.status === 'legacy_active';
  const trialDaysRemaining =
    trialIsActive && trialEndsAtMs !== null
      ? Math.max(0, Math.ceil((trialEndsAtMs - nowMs) / (1000 * 60 * 60 * 24)))
      : 0;

  if (promoterProfile?.isDivulgador) {
    return {
      hasAccess: true,
      shouldLockToSubscription: false,
      reason: 'promoter_free_access',
      trialStartedAt,
      trialEndsAt,
      trialDaysRemaining,
      promoterEnabledAt,
    };
  }

  if (hasPaidAccess) {
    return {
      hasAccess: true,
      shouldLockToSubscription: false,
      reason:
        normalizedRow?.status === 'legacy_active'
          ? 'legacy_access'
          : 'active_subscription',
      trialStartedAt,
      trialEndsAt,
      trialDaysRemaining,
      promoterEnabledAt,
    };
  }

  if (trialIsActive) {
    return {
      hasAccess: true,
      shouldLockToSubscription: false,
      reason: 'trial_active',
      trialStartedAt,
      trialEndsAt,
      trialDaysRemaining,
      promoterEnabledAt,
    };
  }

  if (trialExpired) {
    return {
      hasAccess: false,
      shouldLockToSubscription: true,
      reason: 'trial_expired',
      trialStartedAt,
      trialEndsAt,
      trialDaysRemaining: 0,
      promoterEnabledAt,
    };
  }

  return {
    hasAccess: false,
    shouldLockToSubscription: true,
    reason: normalizedRow ? 'subscription_required' : 'entitlement_missing',
    trialStartedAt,
    trialEndsAt,
    trialDaysRemaining: 0,
    promoterEnabledAt,
  };
}

function deriveSubscriptionRowPayload(subscription, userId) {
  const firstItem = subscription.items?.data?.[0];
  const price = firstItem?.price;
  const plan = getBillingPlanByPriceId(price?.id);

  return {
    user_id: userId,
    stripe_customer_id:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id || null,
    stripe_subscription_id: subscription.id,
    stripe_price_id: price?.id || null,
    plan_code: plan?.code || subscription.metadata?.plan_code || 'custom',
    plan_name: plan?.name || price?.nickname || 'Plano personalizado',
    status: subscription.status,
    billing_interval: price?.recurring?.interval || null,
    billing_interval_count: price?.recurring?.interval_count || null,
    currency: price?.currency || 'brl',
    amount_cents: price?.unit_amount ?? null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    current_period_start: toIsoTimestamp(subscription.current_period_start),
    current_period_end: toIsoTimestamp(subscription.current_period_end),
    canceled_at: toIsoTimestamp(subscription.canceled_at),
    metadata: {
      planCode: subscription.metadata?.plan_code || plan?.code || null,
      stripeStatus: subscription.status,
    },
    updated_at: new Date().toISOString(),
  };
}

async function resolveUserIdForSubscription(client, subscription, userIdHint) {
  if (userIdHint) {
    return userIdHint;
  }

  const metadataUserId = subscription.metadata?.user_id;
  if (metadataUserId) {
    return metadataUserId;
  }

  const stripeCustomerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id || null;

  if (stripeCustomerId) {
    const byCustomer = await getSubscriptionRowByStripeCustomerId(client, stripeCustomerId);
    if (byCustomer?.user_id) {
      return byCustomer.user_id;
    }
  }

  const bySubscription = await getSubscriptionRowByStripeSubscriptionId(client, subscription.id);
  if (bySubscription?.user_id) {
    return bySubscription.user_id;
  }

  return null;
}

export async function upsertSubscriptionFromStripeSubscription(subscription, userIdHint) {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new Error('Supabase administrativo não configurado.');
  }

  const resolvedUserId = await resolveUserIdForSubscription(
    adminClient,
    subscription,
    userIdHint,
  );

  if (!resolvedUserId) {
    throw new Error(`Nao foi possivel associar a assinatura ${subscription.id} a um usuario.`);
  }

  const payload = deriveSubscriptionRowPayload(subscription, resolvedUserId);
  const { error } = await adminClient
    .from('user_subscriptions')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw error;
  }

  return payload;
}

export async function clearSubscriptionForUser({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
}) {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new Error('Supabase administrativo não configurado.');
  }

  const nowIso = new Date().toISOString();
  let resolvedUserId = userId;

  if (!resolvedUserId && stripeSubscriptionId) {
    const row = await getSubscriptionRowByStripeSubscriptionId(adminClient, stripeSubscriptionId);
    resolvedUserId = row?.user_id || null;
  }

  if (!resolvedUserId && stripeCustomerId) {
    const row = await getSubscriptionRowByStripeCustomerId(adminClient, stripeCustomerId);
    resolvedUserId = row?.user_id || null;
  }

  if (!resolvedUserId) {
    return null;
  }

  const { error } = await adminClient
    .from('user_subscriptions')
    .upsert(
      {
        user_id: resolvedUserId,
        stripe_customer_id: stripeCustomerId || null,
        stripe_subscription_id: stripeSubscriptionId || null,
        status: 'canceled',
        cancel_at_period_end: false,
        canceled_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    throw error;
  }

  return resolvedUserId;
}

export async function getOrCreateStripeCustomer({
  userId,
  email,
  fullName,
}) {
  const stripe = getStripeClient();
  const adminClient = getSupabaseAdminClient();

  if (!stripe || !adminClient) {
    throw new Error('Stripe ou Supabase administrativo não configurados.');
  }

  const existingRow = await getSubscriptionRowForUser(adminClient, userId);

  if (existingRow?.stripe_customer_id) {
    return existingRow.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    name: fullName || undefined,
    metadata: {
      user_id: userId,
    },
  });

  const { error } = await adminClient
    .from('user_subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customer.id,
        plan_code: existingRow?.plan_code || 'free',
        plan_name: existingRow?.plan_name || 'Sem assinatura ativa',
        status: existingRow?.status || 'inactive',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    throw error;
  }

  return customer.id;
}

export function serializeSubscriptionRecord(row) {
  const normalizedRow = normalizeSubscriptionRecord(row);

  if (!normalizedRow) {
    return null;
  }

  return {
    userId: normalizedRow.user_id,
    stripeCustomerId: normalizedRow.stripe_customer_id,
    stripeSubscriptionId: normalizedRow.stripe_subscription_id,
    stripePriceId: normalizedRow.stripe_price_id,
    planCode: normalizedRow.plan_code,
    planName: normalizedRow.plan_name,
    status: normalizedRow.status,
    billingInterval: normalizedRow.billing_interval,
    billingIntervalCount: normalizedRow.billing_interval_count,
    currency: normalizedRow.currency,
    amountCents: normalizedRow.amount_cents,
    cancelAtPeriodEnd: normalizedRow.cancel_at_period_end,
    currentPeriodStart: normalizedRow.current_period_start,
    currentPeriodEnd: normalizedRow.current_period_end,
    canceledAt: normalizedRow.canceled_at,
    trialStartedAt: normalizedRow.trial_started_at || null,
    trialEndsAt: normalizedRow.trial_ends_at || null,
    trialConsumedAt: normalizedRow.trial_consumed_at || null,
    trialOrigin: normalizedRow.trial_origin || null,
    metadata: normalizedRow.metadata || null,
    updatedAt: normalizedRow.updated_at,
  };
}
