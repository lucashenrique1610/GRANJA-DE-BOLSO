import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function userClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function cleanupUsers(userIds) {
  for (const userId of userIds) {
    if (!userId) continue;
    await admin.auth.admin.deleteUser(userId);
  }
}

async function main() {
  const suffix = Date.now();
  const email = `rbac-check-${suffix}@example.com`;
  const password = 'Segura123!';
  const createdUserIds = [];

  try {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    if (!created.data.user) throw new Error('Failed to create temporary user.');
    createdUserIds.push(created.data.user.id);

    const client = userClient();
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
    if (!signedIn.data.user) throw new Error('Failed to sign in temporary user.');

    const profileBefore = await client.from('users').select('id, app_role').eq('id', signedIn.data.user.id).single();
    const selfEscalation = await client
      .from('users')
      .update({ app_role: 'admin' })
      .eq('id', signedIn.data.user.id)
      .select('id, app_role')
      .single();
    const profileAfter = await client.from('users').select('id, app_role').eq('id', signedIn.data.user.id).single();

    console.log(JSON.stringify({
      scenario: 'rbac-check',
      email,
      defaultRole: profileBefore.data?.app_role ?? null,
      selfEscalationError: selfEscalation.error?.message ?? null,
      roleAfterAttempt: profileAfter.data?.app_role ?? null,
      passed:
        profileBefore.data?.app_role === 'usuario'
        && Boolean(selfEscalation.error)
        && profileAfter.data?.app_role === 'usuario',
    }, null, 2));
  } finally {
    await cleanupUsers(createdUserIds);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
