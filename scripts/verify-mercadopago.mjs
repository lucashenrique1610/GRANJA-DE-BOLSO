import fs from "fs"
import path from "path"
import { MercadoPagoConfig, Preference } from "mercadopago"

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env.local")
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8")
      // Split lines handling both LF and CRLF
      const lines = content.split(/\r?\n/)
      lines.forEach((line) => {
        // Skip comments
        if (line.trim().startsWith("#")) return
        
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1)
          }
          
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
      console.log("📄 .env.local carregado com sucesso.")
    } else {
      console.log("⚠️  Arquivo .env.local não encontrado. Usando variáveis de ambiente do sistema.")
    }
  } catch (e) {
    console.error("Erro ao ler .env.local:", e.message)
  }
}

loadEnv()

async function verifyMercadoPago() {
  console.log("🔍 Verificando conexão com Mercado Pago...\n")

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!token) {
    console.error("❌ ERRO: Token de acesso ausente!")
    console.error("   Verifique se .env.local contém MERCADOPAGO_ACCESS_TOKEN")
    return
  }

  console.log(`🔑 Token: ${token.substring(0, 10)}...`)

  try {
    const client = new MercadoPagoConfig({ accessToken: token })

    console.log("\n1️⃣  Testando autenticação (Listar Meios de Pagamento)...")
    const startAuth = performance.now()

    const paymentMethods = await fetch("https://api.mercadopago.com/v1/payment_methods", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const authLatency = Math.round(performance.now() - startAuth)

    if (!paymentMethods.ok) {
      const errorData = await paymentMethods.json()
      console.error(`❌ Falha na Autenticação (${authLatency}ms): ${paymentMethods.status} ${paymentMethods.statusText}`)
      console.error("   Detalhes:", JSON.stringify(errorData, null, 2))
    } else {
      const methods = await paymentMethods.json()
      console.log(`✅ Autenticação OK (${authLatency}ms) - ${methods.length} meios de pagamento encontrados.`)
    }

    console.log("\n2️⃣  Testando Criação de Preferência (Simulação)...")
    const startPref = performance.now()

    const preference = new Preference(client)
    try {
      const result = await preference.create({
        body: {
          items: [
            {
              id: "test-item",
              title: "Item de Teste - Verificação",
              quantity: 1,
              unit_price: 1.0,
            },
          ],
          external_reference: "test-verification-script",
        },
      })

      const prefLatency = Math.round(performance.now() - startPref)
      console.log(`✅ Criação de Preferência OK (${prefLatency}ms)`)
      console.log(`   ID da Preferência: ${result.id}`)
      console.log(`   Link de Teste: ${result.sandbox_init_point}`)
    } catch (prefError) {
      const prefLatency = Math.round(performance.now() - startPref)
      console.error(`❌ Falha na Criação de Preferência (${prefLatency}ms):`)
      if (prefError.cause) {
        console.error("   Causa:", JSON.stringify(prefError.cause, null, 2))
      } else {
        console.error("   Erro:", prefError.message)
      }
    }

    if (paymentMethods.ok) {
      console.log("\n🎉 CONEXÃO COM MERCADO PAGO ESTABELECIDA!")
    } else {
      console.log("\n⚠️  Foram encontrados problemas na conexão.")
    }
  } catch (e) {
    console.error("\n❌ ERRO CRÍTICO DE EXECUÇÃO:", e.message)
  }
}

verifyMercadoPago()
