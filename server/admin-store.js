import { deriveAccessState, getSupabaseAdminClient, serializeSubscriptionRecord } from './billing-store.js';

function getDateValue(value) {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export async function listAdminUsersOverview() {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new Error('Supabase administrativo não configurado.');
  }

  const [{ data: users, error: usersError }, { data: granjas, error: granjasError }, { data: subscriptions, error: subscriptionsError }] =
    await Promise.all([
      adminClient
        .from('users')
        .select('id, created_at, full_name, email, phone, app_role, is_divulgador, divulgador_enabled_at')
        .order('created_at', { ascending: false }),
      adminClient
        .from('granjas')
        .select('id, user_id, farm_name, city, state')
        .order('created_at', { ascending: false }),
      adminClient
        .from('user_subscriptions')
        .select('*')
        .order('updated_at', { ascending: false }),
    ]);

  if (usersError) {
    throw usersError;
  }

  if (granjasError) {
    throw granjasError;
  }

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  const granjaByUserId = new Map();
  for (const granja of granjas || []) {
    if (!granjaByUserId.has(granja.user_id)) {
      granjaByUserId.set(granja.user_id, granja);
    }
  }

  const subscriptionByUserId = new Map();
  for (const subscription of subscriptions || []) {
    if (!subscriptionByUserId.has(subscription.user_id)) {
      subscriptionByUserId.set(subscription.user_id, subscription);
    }
  }

  const rows = (users || []).map((user) => {
    const granja = granjaByUserId.get(user.id) || null;
    const subscription = subscriptionByUserId.get(user.id) || null;
    const access = deriveAccessState(subscription, user);

    return {
      id: user.id,
      createdAt: user.created_at || null,
      fullName: user.full_name || 'Sem nome',
      email: user.email || '',
      phone: user.phone || null,
      appRole: user.app_role || 'usuario',
      isDivulgador: Boolean(user.is_divulgador),
      divulgadorEnabledAt: user.divulgador_enabled_at || null,
      farm: granja
        ? {
            id: granja.id,
            name: granja.farm_name || 'Sem granja',
            city: granja.city || null,
            state: granja.state || null,
          }
        : null,
      subscription: serializeSubscriptionRecord(subscription),
      access,
    };
  });

  rows.sort((a, b) => getDateValue(b.createdAt) - getDateValue(a.createdAt));

  const summary = {
    totalUsers: rows.length,
    totalAdmins: rows.filter((row) => row.appRole === 'admin').length,
    totalDivulgadores: rows.filter((row) => row.isDivulgador).length,
    totalActiveSubscriptions: rows.filter((row) => row.subscription?.status === 'active').length,
    totalTrialActive: rows.filter((row) => row.access.reason === 'trial_active').length,
  };

  return {
    summary,
    users: rows,
  };
}
