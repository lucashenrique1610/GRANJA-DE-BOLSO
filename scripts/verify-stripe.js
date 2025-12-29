
const stripe = require('stripe');

async function verifyStripeConnection() {
  console.log('🔍 Verificando conexão com Stripe...\n');

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error('❌ ERRO: Chave STRIPE_SECRET_KEY não encontrada!');
    console.error('   Verifique se .env.local contém a chave secreta.');
    return;
  }

  // Verifica se é chave de teste
  if (!secretKey.startsWith('sk_test_')) {
      console.warn('⚠️  AVISO: Você está usando uma chave de PRODUÇÃO (live mode).');
      console.warn('   As operações criarão objetos reais no Stripe.\n');
  } else {
      console.log('ℹ️  Modo de Teste (Sandbox) detectado.\n');
  }

  try {
    const stripeClient = stripe(secretKey);

    console.log('1️⃣  Testando autenticação (Listar Produtos)...');
    const startAuth = performance.now();
    const products = await stripeClient.products.list({ limit: 1 });
    const authLatency = Math.round(performance.now() - startAuth);

    console.log(`✅ Autenticação OK (${authLatency}ms)`);
    
    if (products.data.length === 0) {
        console.warn('⚠️  Nenhum produto encontrado. Você precisa criar produtos no Dashboard do Stripe.');
    } else {
        console.log(`   Produto encontrado: ${products.data[0].name} (${products.data[0].id})`);
    }

    console.log('\n2️⃣  Verificando IDs de Preço configurados...');
    const plans = ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL'];
    let allValid = true;

    for (const plan of plans) {
        const key = `STRIPE_PRICE_ID_${plan}`;
        const priceId = process.env[key];
        
        if (!priceId) {
            console.warn(`   ❌ ${key} não configurado no .env.local`);
            allValid = false;
        } else {
            try {
                const price = await stripeClient.prices.retrieve(priceId);
                console.log(`   ✅ ${key}: Válido (${price.unit_amount / 100} ${price.currency.toUpperCase()})`);
            } catch (e) {
                console.error(`   ❌ ${key}: Inválido ou não encontrado (${priceId})`);
                allValid = false;
            }
        }
    }

    if (allValid) {
        console.log('\n🎉 CONFIGURAÇÃO DO STRIPE COMPLETA E VÁLIDA!');
    } else {
        console.log('\n⚠️  Alguns planos não estão configurados corretamente.');
    }

  } catch (e) {
    console.error('\n❌ ERRO DE CONEXÃO:', e.message);
  }
}

// Carregar envs manualmente pois o script roda isolado
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
    console.log('📄 .env.local carregado com sucesso.');
  }
} catch (e) {
  console.warn('⚠️  Não foi possível carregar .env.local automaticamente.');
}

verifyStripeConnection();
