/**
 * Serviço centralizado para gerenciar dados da aplicação
 * Encapsula operações de leitura e escrita no localStorage
 */

// Tipos de dados
export interface Lote {
  id: string
  quantidade: number
  fornecedor: string
  dataCompra: string
  valorLote: number
  valorAve: number
  tipo: string
  raca: string
  femeas: number
  machos: number
}

export interface Manejo {
  status: string
  loteId: string
  ovos: number
  ovosDanificados: number
  racao: number
  agua: number
  porta: string
  outros: string
  pesoOvos: number
  classificacao: string
}

export interface ManejoDia {
  [data: string]: {
    manha?: Manejo
    tarde?: Manejo
  }
}

export interface Estoque {
  ovos: number
  galinhas_vivas: number
  galinhas_limpas: number
  cama_aves: number
}

export interface AplicacaoSaude {
  data: string
  loteId: string
  fase: string
  tipo: string
  nome: string
  veterinario: string
  quantidade: number
  observacoes: string
  proximaDose: string
  dataProxima: string
  formulacaoId: string | null
}

export interface Mortalidade {
  data: string
  loteId: string
  quantidade: number
  causa: string
  observacoes: string
}

export interface Cliente {
  id: string
  nome: string
  endereco: string
  telefone: string
  cpfCnpj?: string
  tipo: "fisico" | "juridico"
}

export interface Fornecedor {
  id: string
  nome: string
  cpfCnpj?: string
  telefone: string
  endereco: string
  produtos: string
}

export interface Venda {
  data: string
  cliente: string
  produto: string
  quantidade: number
  pagamento: string
  valor: number
  loteId: string
}

export interface Compra {
  data: string
  fornecedor: string
  tipo: string
  quantidade: number
  valor: number
  descricao: string
  categoria: string
}

// Dicas: tipos e armazenamento
export type TipAction = "view" | "ignore" | "irrelevant" | "related"

export interface TipFeedback {
  id: string
  action: TipAction
  ts: number
  path: string
}

export interface TipPreferences {
  dismissed: string[]
  irrelevant: string[]
  lastShown: Record<string, number>
}

// Funções auxiliares
function getItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === "undefined") {
      return defaultValue
    }
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    if (typeof window === "undefined") {
      return
    }
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error)
  }
}

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null
  const storedSession = localStorage.getItem("granja_session")
  if (storedSession) {
      try {
          const session = JSON.parse(storedSession)
          return session.access_token || null
      } catch {}
  }
  return null
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelay = 300): Promise<T> {
  let lastError: any
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i < attempts - 1) {
        await delay(baseDelay * Math.pow(2, i))
      }
    }
  }
  throw lastError
}

async function upsertClienteSupabase(cliente: Cliente): Promise<boolean> {
  const token = getSessionToken()
  if (!token) return false
  
  try {
      const ok = await withRetry(async () => {
        const res = await fetch("/api/clientes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              id: cliente.id,
              nome: cliente.nome,
              endereco: cliente.endereco,
              telefone: cliente.telefone,
              cpf_cnpj: cliente.cpfCnpj,
              tipo: cliente.tipo
            })
        })
        if (!res.ok) throw new Error("failed")
        return true
      })
      return ok
  } catch {
      return false
  }
}

async function fetchClientesSupabase(): Promise<Cliente[]> {
  const token = getSessionToken()
  if (!token) return []
  
  try {
      const arr = await withRetry(async () => {
        const res = await fetch("/api/clientes", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        if (!res.ok) throw new Error("failed")
        return await res.json()
      })
      
      if (Array.isArray(arr)) {
        return arr.map((c: any) => ({
          id: c.id || crypto.randomUUID(), // Ensure ID exists
          nome: c.nome,
          endereco: c.endereco,
          telefone: c.telefone,
          cpfCnpj: c.cpf_cnpj || c.cpfCnpj || undefined,
          tipo: c.tipo
        }))
      }
      return []
  } catch {
      return []
  }
}


// Funções de acesso aos dados
export const DataService = {
  // Lotes
  getLotes: (): Lote[] => getItem<Lote[]>("lotes", []),
  saveLote: (lote: Lote) => {
    const lotes = DataService.getLotes()
    const index = lotes.findIndex((l) => l.id === lote.id)

    if (index >= 0) {
      lotes[index] = lote
    } else {
      lotes.push(lote)
    }

    setItem("lotes", lotes)
    return lote
  },
  // Função implementada para uso futuro
  deleteLote: (id: string) => {
    const lotes = DataService.getLotes().filter((l) => l.id !== id)
    setItem("lotes", lotes)
  },

  // Manejo
  getManejoDia: (): ManejoDia => getItem<ManejoDia>("manejoDia", {}),
  // Função implementada para uso futuro
  saveManejo: (data: string, periodo: "manha" | "tarde", manejo: Manejo) => {
    const manejoDia = DataService.getManejoDia()

    if (!manejoDia[data]) {
      manejoDia[data] = {}
    }

    manejoDia[data][periodo] = manejo

    // Atualizar estoque de ovos
    const estoque = DataService.getEstoque()
    estoque.ovos = (estoque.ovos || 0) + manejo.ovos - (manejo.ovosDanificados || 0)
    DataService.saveEstoque(estoque)

    setItem("manejoDia", manejoDia)
    return manejoDia
  },

  // Estoque
  getEstoque: (): Estoque =>
    getItem<Estoque>("estoque", {
      ovos: 0,
      galinhas_vivas: 0,
      galinhas_limpas: 0,
      cama_aves: 0,
    }),
  saveEstoque: (estoque: Estoque) => {
    setItem("estoque", estoque)
    return estoque
  },

  // Aplicações de Saúde
  getAplicacoesSaude: (): AplicacaoSaude[] => getItem<AplicacaoSaude[]>("aplicacoesSaude", []),
  saveAplicacaoSaude: (aplicacao: AplicacaoSaude) => {
    const aplicacoes = DataService.getAplicacoesSaude()
    aplicacoes.push(aplicacao)
    setItem("aplicacoesSaude", aplicacoes)
    return aplicacao
  },

  // Mortalidade
  getMortalidade: (): Mortalidade[] => getItem<Mortalidade[]>("mortalidade", []),
  saveMortalidade: (mortalidade: Mortalidade) => {
    const registros = DataService.getMortalidade()

    // Atualizar estoque de aves
    const estoque = DataService.getEstoque()
    estoque.galinhas_vivas = Math.max(0, estoque.galinhas_vivas - mortalidade.quantidade)
    DataService.saveEstoque(estoque)

    registros.push(mortalidade)
    setItem("mortalidade", registros)
    return mortalidade
  },

  // Clientes
  getClientes: (): Cliente[] => getItem<Cliente[]>("clientes", []),
  saveCliente: (cliente: Cliente) => {
    const clientes = DataService.getClientes()
    
    // Ensure ID
    if (!cliente.id) {
      cliente.id = crypto.randomUUID()
    }

    const index = clientes.findIndex((c) => c.id === cliente.id)

    if (index >= 0) {
      clientes[index] = cliente
    } else {
      clientes.push(cliente)
    }

    setItem("clientes", clientes)
    void upsertClienteSupabase(cliente)
    return cliente
  },

  // Fornecedores
  getFornecedores: (): Fornecedor[] => getItem<Fornecedor[]>("fornecedores", []),
  saveFornecedor: (fornecedor: Fornecedor) => {
    const fornecedores = DataService.getFornecedores()
    
    // Ensure ID
    if (!fornecedor.id) {
      fornecedor.id = crypto.randomUUID()
    }

    const index = fornecedores.findIndex((f) => f.id === fornecedor.id)

    if (index >= 0) {
      fornecedores[index] = fornecedor
    } else {
      fornecedores.push(fornecedor)
    }

    setItem("fornecedores", fornecedores)
    return fornecedor
  },

  // Backup Stub (Compatibility)
  createBackup: async (): Promise<boolean> => {
    console.warn("DataService.createBackup is deprecated. Use BackupService instead.")
    return false
  },

  
  loadClientesFromSupabase: async (): Promise<Cliente[]> => {
    const arr = await fetchClientesSupabase()
    if (arr.length) {
      setItem("clientes", arr)
    }
    return arr
  },

  testSupabaseConnection: async (): Promise<{ ok: boolean; error?: string }> => {
    try {
        const res = await fetch("/api/status/supabase")
        const data = await res.json()
        if (data.ok) return { ok: true }
        return { ok: false, error: data.error || "Erro de conexão" }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
  },

  // Vendas
  getVendas: (): Venda[] => getItem<Venda[]>("vendas", []),
  saveVenda: (venda: Venda) => {
    const vendas = DataService.getVendas()

    // Atualizar estoque
    const estoque = DataService.getEstoque()
    if (estoque[venda.produto as keyof Estoque] !== undefined) {
      estoque[venda.produto as keyof Estoque] = Math.max(
        0,
        (estoque[venda.produto as keyof Estoque] as number) - venda.quantidade,
      )
      DataService.saveEstoque(estoque)
    }

    vendas.push(venda)
    setItem("vendas", vendas)
    return venda
  },

  // Compras
  getCompras: (): Compra[] => getItem<Compra[]>("compras", []),
  saveCompra: (compra: Compra) => {
    const compras = DataService.getCompras()
    compras.push(compra)
    setItem("compras", compras)
    return compra
  },

  // Alertas
  getAlertas: (): string[] => {
    const alertas: string[] = []

    // Verificar aplicações de saúde
    const aplicacoes = DataService.getAplicacoesSaude()
    aplicacoes.forEach((a) => {
      if (a.dataProxima) {
        const dateParts = a.dataProxima.split("/")
        const dataProxima = new Date(
          Number.parseInt(dateParts[2]),
          Number.parseInt(dateParts[1]) - 1,
          Number.parseInt(dateParts[0]),
        )
        const today = new Date()
        const diasRestantes = Math.ceil((dataProxima.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (diasRestantes <= 7 && diasRestantes >= 0) {
          alertas.push(`Próxima dose de ${a.nome} (${a.loteId}) em ${diasRestantes} dias`)
        }
      }
    })

    // Verificar estoque
    const estoque = DataService.getEstoque()
    if (estoque.ovos < 50) {
      alertas.push("Estoque de ovos baixo (< 50 unidades)!")
    }
    if (estoque.galinhas_vivas < 10) {
      alertas.push("Estoque de galinhas vivas baixo (< 10)!")
    }

    // Verificar manejo diário
    const today = new Date().toLocaleDateString("pt-BR")
    const manejoDia = DataService.getManejoDia()

    if (!manejoDia[today]?.manha) {
      alertas.push("Manejo da manhã pendente!")
    }
    if (!manejoDia[today]?.tarde) {
      alertas.push("Manejo da tarde pendente!")
    }

    return alertas
  },

  // Dicas: feedback e preferências
  getTipFeedbacks: (): TipFeedback[] => getItem<TipFeedback[]>("tipFeedbacks", []),
  saveTipFeedback: (fb: TipFeedback) => {
    const list = DataService.getTipFeedbacks()
    list.push(fb)
    setItem("tipFeedbacks", list)
    return fb
  },
  getTipPreferences: (): TipPreferences =>
    getItem<TipPreferences>("tipPreferences", { dismissed: [], irrelevant: [], lastShown: {} }),
  saveTipPreferences: (prefs: TipPreferences) => {
    setItem("tipPreferences", prefs)
    return prefs
  },
  dismissTipTemporarily: (id: string) => {
    const prefs = DataService.getTipPreferences()
    if (!prefs.dismissed.includes(id)) {
      prefs.dismissed.push(id)
    }
    DataService.saveTipPreferences(prefs)
  },
  markTipIrrelevant: (id: string) => {
    const prefs = DataService.getTipPreferences()
    if (!prefs.irrelevant.includes(id)) {
      prefs.irrelevant.push(id)
    }
    DataService.saveTipPreferences(prefs)
  },
  setTipLastShown: (id: string, ts: number) => {
    const prefs = DataService.getTipPreferences()
    prefs.lastShown[id] = ts
    DataService.saveTipPreferences(prefs)
  },
}

