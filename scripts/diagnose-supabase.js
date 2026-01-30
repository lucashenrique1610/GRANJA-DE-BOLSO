
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split(/\r?\n/).forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match && !match[1].startsWith('#')) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
        console.log("✅ .env.local carregado.");
    }
} catch (e) {
    console.log("ℹ️ Erro ao ler .env.local ou arquivo inexistente.");
}

async function runDiagnostics() {
    console.log("\n=== DIAGNÓSTICO SUPABASE ===\n");

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Check Env Vars
    console.log("1. Verificando Variáveis de Ambiente...");
    if (!SUPABASE_URL) console.error("❌ NEXT_PUBLIC_SUPABASE_URL ausente.");
    else console.log(`✅ URL: ${SUPABASE_URL}`);

    if (!SERVICE_KEY) console.error("❌ SUPABASE_SERVICE_ROLE_KEY ausente.");
    else console.log(`✅ SERVICE_KEY: ${SERVICE_KEY.substring(0, 10)}...`);

    if (!ANON_KEY) console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.");
    else console.log(`✅ ANON_KEY: ${ANON_KEY.substring(0, 10)}...`);

    if (!SUPABASE_URL || !SERVICE_KEY) {
        console.error("⛔ Interrompendo: Credenciais insuficientes.");
        return;
    }

    // 2. Test Admin Connection (Service Role)
    console.log("\n2. Testando Conexão Admin (Service Role)...");
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const testId = `diag_${Date.now()}`;
    const testData = {
        mercadopago_id: testId,
        user_id: 'diagnose_system', // ID fictício
        amount: 1.00,
        status: 'pending',
        plan_id: 'diagnostico'
    };

    try {
        // Tentar inserir na tabela pix_transactions (que sabemos que existe)
        const { data, error } = await adminClient
            .from('pix_transactions')
            .insert(testData)
            .select()
            .single();

        if (error) {
            console.error(`❌ Falha na escrita (Admin): ${error.message}`);
            console.error(`   Detalhes: ${JSON.stringify(error)}`);
            // Verificar se é erro de RLS mesmo com admin (não deveria)
            if (error.code === '42501') console.error("   ⚠️ Erro de Permissão (RLS). Service Role deveria ignorar isso.");
        } else {
            console.log(`✅ Escrita Admin OK. ID: ${data.id}`);
            
            // Limpeza
            const { error: delError } = await adminClient
                .from('pix_transactions')
                .delete()
                .eq('mercadopago_id', testId);
                
            if (!delError) console.log("✅ Limpeza (Delete) Admin OK.");
            else console.error(`⚠️ Falha na limpeza: ${delError.message}`);
        }
    } catch (e) {
        console.error(`❌ Exceção no teste Admin: ${e.message}`);
    }

    // 3. Test Anon Connection (Public Read)
    console.log("\n3. Testando Conexão Pública (Anon Key)...");
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    
    // Tentar ler algo público ou verificar conexão básica
    // Como RLS está ativado e tudo é privado, esperamos erro ou vazio, mas a conexão deve ocorrer
    const { error: anonError } = await anonClient.from('pix_transactions').select('*').limit(1);
    
    if (anonError) {
        // RLS pode retornar erro ou array vazio dependendo da config.
        // Geralmente retorna array vazio se não tiver permissão de select, mas conexão ok.
        // Se der erro de conexão/autenticação (JWT inválido), é problema.
        console.log(`ℹ️ Resposta Anon: ${anonError.message} (Esperado se RLS bloquear leitura anônima)`);
    } else {
        console.log("✅ Conexão Anon OK (RLS permitiu leitura ou retornou vazio).");
    }
}

runDiagnostics();
