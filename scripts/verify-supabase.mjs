import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env.local")
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8")
      const lines = content.split("\n")
      lines.forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^["']|["']$/g, "")
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

async function verifyConnection() {
  console.log("🔍 Verificando conexão com Supabase...\n")

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error("❌ ERRO: Variáveis de ambiente ausentes!")
    console.error("   Verifique se .env.local contém:")
    console.error("   - NEXT_PUBLIC_SUPABASE_URL")
    console.error("   - SUPABASE_SERVICE_ROLE_KEY")
    return
  }

  console.log(`📡 URL: ${url}`)
  console.log(`🔑 Key (Service Role): ${key.substring(0, 10)}...`)

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    })

    console.log("\n1️⃣  Testando API de Autenticação...")
    const startAuth = performance.now()
    const { error: authError } = await supabase.auth.getSession()
    const authLatency = Math.round(performance.now() - startAuth)

    if (authError) {
      console.error(`❌ Falha na Auth API (${authLatency}ms): ${authError.message}`)
    } else {
      console.log(`✅ Auth API OK (${authLatency}ms)`)
    }

    console.log("\n2️⃣  Testando Conexão com Banco de Dados...")
    const startDb = performance.now()
    const { error: dbError } = await supabase.from("profiles").select("*", { count: "exact", head: true })
    const dbLatency = Math.round(performance.now() - startDb)

    if (dbError) {
      console.error(`❌ Falha no Banco de Dados (${dbLatency}ms): ${dbError.message}`)
      if (dbError.code === "PGRST116") {
        console.warn("   (Isso pode ser apenas porque a tabela não existe, mas a conexão foi feita)")
      }
    } else {
      console.log(`✅ Banco de Dados OK (${dbLatency}ms)`)
    }

    if (!authError && !dbError) {
      console.log("\n🎉 CONEXÃO ESTABELECIDA COM SUCESSO!")
    } else {
      console.log("\n⚠️  Foram encontrados problemas na conexão.")
    }
  } catch (e) {
    console.error("\n❌ ERRO CRÍTICO DE EXECUÇÃO:", e.message)
  }
}

verifyConnection()
