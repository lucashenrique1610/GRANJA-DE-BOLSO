import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing required env vars: SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY/SERVICE_ROLE_KEY');
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

async function createConfirmedUser(email, password) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function signIn(email, password) {
  const sb = userClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  return { sb, user: data.user };
}

async function cleanupUsers(userIds) {
  for (const userId of userIds) {
    if (!userId) continue;
    await admin.auth.admin.deleteUser(userId);
  }
}

async function main() {
  const suffix = Date.now();
  const password = 'Segura123!';
  const emailA = `idor-a-${suffix}@example.com`;
  const emailB = `idor-b-${suffix}@example.com`;
  const createdUserIds = [];

  try {
    const userA = await createConfirmedUser(emailA, password);
    const userB = await createConfirmedUser(emailB, password);
    createdUserIds.push(userA?.id, userB?.id);

    const { sb: sbA, user: authUserA } = await signIn(emailA, password);
    const { sb: sbB, user: authUserB } = await signIn(emailB, password);

    const granjaAResult = await sbA.from('granjas').insert({
      user_id: authUserA.id,
      farm_name: 'Farm A',
      state: 'SP',
      city: 'Campinas',
      bird_count: 10,
      selected_palette: 'blue',
      marketing_source: 'security-test',
      egg_sale_price: 0,
      bird_sale_price: 0,
      litter_sale_price: 0,
      auto_backup_enabled: false,
      auto_backup_frequency: 'weekly',
      auto_backup_keep_count: 10,
    }).select('*').single();
    if (granjaAResult.error) throw granjaAResult.error;

    const granjaBResult = await sbB.from('granjas').insert({
      user_id: authUserB.id,
      farm_name: 'Farm B',
      state: 'SP',
      city: 'Santos',
      bird_count: 10,
      selected_palette: 'blue',
      marketing_source: 'security-test',
      egg_sale_price: 0,
      bird_sale_price: 0,
      litter_sale_price: 0,
      auto_backup_enabled: false,
      auto_backup_frequency: 'weekly',
      auto_backup_keep_count: 10,
    }).select('*').single();
    if (granjaBResult.error) throw granjaBResult.error;

    const clientAResult = await sbA.from('clientes').insert({
      user_id: authUserA.id,
      granja_id: granjaAResult.data.id,
      name: 'Cliente A',
      document: '123',
      phone: '11999999999',
      email: emailA,
      city: 'Campinas',
      state: 'SP',
      status: 'ativo',
      notes: '',
    }).select('*').single();
    if (clientAResult.error) throw clientAResult.error;

    const readAttempt = await sbB.from('clientes').select('*').eq('id', clientAResult.data.id);
    const foreignGranjaInsert = await sbB.from('clientes').insert({
      user_id: authUserB.id,
      granja_id: granjaAResult.data.id,
      name: 'Cross Tenant Client',
      document: '456',
      phone: '11888888888',
      email: emailB,
      city: 'Santos',
      state: 'SP',
      status: 'ativo',
      notes: '',
    }).select('*').single();
    const foreignVendaInsert = await sbB.from('vendas').insert({
      user_id: authUserB.id,
      granja_id: granjaBResult.data.id,
      date: '2026-07-02',
      client_id: clientAResult.data.id,
      produto: 'ovos',
      quantidade: 1,
      lote: 'L1',
      forma_pagamento: 'pix',
      valor_unitario: 1,
      valor_total: 1,
      notes: '',
    }).select('*').single();

    console.log(JSON.stringify({
      scenario: 'idor-authz-check',
      userA: emailA,
      userB: emailB,
      readAttempt: {
        count: readAttempt.data?.length ?? 0,
        error: readAttempt.error?.message ?? null,
      },
      foreignGranjaInsert: {
        error: foreignGranjaInsert.error?.message ?? null,
      },
      foreignVendaInsert: {
        error: foreignVendaInsert.error?.message ?? null,
      },
      passed: (readAttempt.data?.length ?? 0) === 0
        && Boolean(foreignGranjaInsert.error)
        && Boolean(foreignVendaInsert.error),
    }, null, 2));
  } finally {
    await cleanupUsers(createdUserIds);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
