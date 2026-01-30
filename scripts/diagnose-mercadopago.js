
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const fs = require('fs');
const path = require('path');

// Try to load dotenv if available, otherwise assume env vars are loaded
try {
    const dotenv = require('dotenv');
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
} catch (e) {
    console.log("ℹ️ dotenv not found, assuming environment variables are loaded via --env-file or system.");
}

async function runDiagnostics() {
    console.log("=== INICIANDO DIAGNÓSTICO DO MERCADO PAGO ===\n");

    const report = {
        timestamp: new Date().toISOString(),
        checks: [],
        metrics: {}
    };

    // 1. Verificação de Ambiente
    console.log("1. Verificando Variáveis de Ambiente...");
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!token) {
        console.error("❌ ERRO: MERCADOPAGO_ACCESS_TOKEN não encontrado.");
        report.checks.push({ name: "Environment", status: "FAILED", error: "Token missing" });
        return report;
    } else {
        console.log("✅ Token encontrado (inicia com " + token.substring(0, 10) + "...)");
    }

    if (!appUrl) {
        console.warn("⚠️ AVISO: NEXT_PUBLIC_APP_URL não definido. Webhooks podem falhar.");
        report.checks.push({ name: "Environment", status: "WARNING", message: "APP_URL missing" });
    } else {
        console.log("✅ APP_URL: " + appUrl);
    }
    report.checks.push({ name: "Environment", status: "PASSED" });

    // Initialize SDK
    const client = new MercadoPagoConfig({ accessToken: token });
    
    // 2. Teste de Conectividade (Listar Pagamentos)
    console.log("\n2. Testando Conectividade (API)...");
    const payment = new Payment(client);
    const startConn = performance.now();
    try {
        // Tenta buscar o último pagamento apenas para validar o token
        const searchResult = await payment.search({ options: { limit: 1, offset: 0 } });
        const latency = performance.now() - startConn;
        console.log(`✅ Conexão estabelecida com sucesso. Latência: ${latency.toFixed(2)}ms`);
        report.metrics.connection_latency_ms = latency;
        report.checks.push({ name: "Connectivity", status: "PASSED" });
    } catch (error) {
        console.error("❌ ERRO de Conexão:", error.message);
        report.checks.push({ name: "Connectivity", status: "FAILED", error: error.message });
        return report; // Stop if connection fails
    }

    // 3. Teste de Criação de Preferência (Checkout Pro)
    console.log("\n3. Testando Criação de Preferência (Checkout Pro)...");
    const preference = new Preference(client);
    const startPref = performance.now();
    try {
        const prefData = {
            body: {
                items: [
                    {
                        id: 'diag_test_01',
                        title: 'Item de Teste Diagnóstico',
                        quantity: 1,
                        unit_price: 1.00
                    }
                ],
                back_urls: {
                    success: "https://www.google.com/success",
                    failure: "https://www.google.com/failure",
                    pending: "https://www.google.com/pending"
                },
                auto_return: "approved"
            }
        };
        const prefResult = await preference.create(prefData);
        const latency = performance.now() - startPref;
        console.log(`✅ Preferência criada. ID: ${prefResult.id}`);
        console.log(`   Init Point: ${prefResult.init_point}`);
        console.log(`   Latência: ${latency.toFixed(2)}ms`);
        report.metrics.preference_creation_latency_ms = latency;
        report.checks.push({ name: "Preference Creation", status: "PASSED" });
    } catch (error) {
        console.error("❌ ERRO ao criar preferência:", error.message);
        report.checks.push({ name: "Preference Creation", status: "FAILED", error: error.message });
    }

    // 4. Teste de Criação de PIX
    console.log("\n4. Testando Criação de Pagamento PIX...");
    const startPix = performance.now();
    let pixId = null;
    try {
        const pixData = {
            body: {
                transaction_amount: 1.00,
                description: 'Diagnóstico PIX',
                payment_method_id: 'pix',
                payer: {
                    email: 'test_user_123@test.com'
                }
            }
        };
        const pixResult = await payment.create(pixData);
        const latency = performance.now() - startPix;
        pixId = pixResult.id;
        console.log(`✅ PIX criado. ID: ${pixId}`);
        console.log(`   Status: ${pixResult.status}`);
        console.log(`   Latência: ${latency.toFixed(2)}ms`);
        report.metrics.pix_creation_latency_ms = latency;
        report.checks.push({ name: "PIX Creation", status: "PASSED" });
    } catch (error) {
        console.error("❌ ERRO ao criar PIX:", error.message);
        report.checks.push({ name: "PIX Creation", status: "FAILED", error: error.message });
    }

    // 5. Teste de Cancelamento (se PIX foi criado)
    if (pixId) {
        console.log(`\n5. Testando Cancelamento de Pagamento (${pixId})...`);
        const startCancel = performance.now();
        try {
            const cancelResult = await payment.cancel({ id: pixId });
            const latency = performance.now() - startCancel;
            console.log(`✅ Pagamento cancelado com sucesso.`);
            console.log(`   Status: ${cancelResult.status}`);
            console.log(`   Latência: ${latency.toFixed(2)}ms`);
            report.metrics.cancellation_latency_ms = latency;
            report.checks.push({ name: "Cancellation", status: "PASSED" });
        } catch (error) {
            console.error("❌ ERRO ao cancelar pagamento:", error.message);
            // Cancelamento pode falhar dependendo do status ou permissões, mas geralmente funciona para pendente
            report.checks.push({ name: "Cancellation", status: "WARNING", error: error.message });
        }
    }

    // 6. Resumo
    console.log("\n=== RESUMO ===");
    const passed = report.checks.filter(c => c.status === "PASSED").length;
    const total = report.checks.length;
    console.log(`Testes: ${passed}/${total} Aprovados`);
    
    return report;
}

runDiagnostics().catch(console.error);
