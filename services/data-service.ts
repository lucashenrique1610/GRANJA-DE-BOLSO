/**
 * Serviço centralizado para gerenciar dados da aplicação
 * Usa Supabase diretamente via APIs de backend
 */

// Tipos de dados
export interface Lote {
  id: string
  quantidade: number
  fornecedor: string
  data_compra?: string
  dataCompra?: string
  valor_lote: number
  valorLote?: number
  valor_ave: number
  valorAve?: number
  tipo: string
  raca: string
  femeas: number
  machos: number
  nome?: string
  localizacao?: string
  finalidade?: string
  observacoes?: string
  documentos?: string[]
}

export interface VisitaVeterinaria {
  id: string
  lote_id: string
  loteId?: string
  data: string
  tipo_procedimento?: string
  tipoProcedimento?: string
  veterinario?: string
  observacoes?: string
}

export interface Manejo {
  status?: string
  lote_id?: string
  loteId?: string
  ovos: number
  ovos_danificados: number
  ovosDanificados?: number
  racao: number
  agua: number
  porta?: string
  outros?: string
  peso_ovos: number
  pesoOvos?: number
  classificacao?: string
}

export interface ManejoHistorico {
  id: string
  lote_id?: string
  loteId?: string
  data: string
  periodo: string
  ovos: number
  ovos_danificados: number
  ovosDanificados?: number
  racao: number
  agua: number
  peso_ovos: number
  pesoOvos?: number
}

export interface ManejoDia {
  [data: string]: {
    manha?: Manejo
    tarde?: Manejo
  }
}

export interface Estoque {
  user_id?: string
  ovos: number
  galinhas_vivas: number
  galinhas_limpas: number
  cama_aves: number
}

export interface AplicacaoSaude {
  id?: string
  data: string
  lote_id?: string
  loteId?: string
  fase?: string
  tipo?: string
  nome?: string
  veterinario?: string
  quantidade: number
  observacoes?: string
  proxima_dose?: string
  proximaDose?: string
  data_proxima?: string
  dataProxima?: string
  formulacao_id?: string | null
  formulacaoId?: string | null
}

export interface Mortalidade {
  id?: string
  data: string
  lote_id?: string
  loteId?: string
  quantidade: number
  causa?: string
  observacoes?: string
}

export interface Cliente {
  id: string
  nome: string
  endereco?: string
  telefone?: string
  cpf_cnpj?: string
  cpfCnpj?: string
  tipo: 'fisico' | 'juridico'
}

export interface Fornecedor {
  id: string
  nome: string
  cpf_cnpj?: string
  cpfCnpj?: string
  telefone?: string
  endereco?: string
  produtos?: string
}

export interface Venda {
  id?: string
  data: string
  cliente_id?: string
  clienteId?: string
  cliente_nome?: string
  cliente?: string
  produto: string
  quantidade: number
  pagamento: string
  valor: number
  lote_id?: string
  loteId?: string
}

export interface Compra {
  id?: string
  data: string
  fornecedor_id?: string
  fornecedorId?: string
  fornecedor_nome?: string
  fornecedor?: string
  tipo?: string
  quantidade: number
  valor: number
  descricao?: string
  categoria?: string
}

export interface TipFeedback {
  id: string
  action: string
  ts: number
  path: string
}

export interface TipPreferences {
  dismissed: string[]
  irrelevant: string[]
  last_shown?: Record<string, number>
  lastShown?: Record<string, number>
}

export interface AuditLog {
  id: string
  timestamp: string
  action: string
  entity: string
  entity_id: string
  details: string
  user: string
}

// Função auxiliar para obter token de sessão
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

// Funções auxiliares para conversão de snake_case ↔ camelCase
function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function toSnakeCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

function keysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase)
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {}
    Object.keys(obj).forEach(key => {
      const newKey = toCamelCase(key)
      newObj[newKey] = keysToCamelCase(obj[key])
    })
    return newObj
  }
  return obj
}

function keysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(keysToSnakeCase)
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {}
    Object.keys(obj).forEach(key => {
      const newKey = toSnakeCase(key)
      newObj[newKey] = keysToSnakeCase(obj[key])
    })
    return newObj
  }
  return obj
}

// Função auxiliar para requisições à API
async function apiRequest(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  body?: any
): Promise<any> {
  const token = getSessionToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    method,
    headers
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(keysToSnakeCase(body))
  }

  try {
    const res = await fetch(`/api/${endpoint}`, config)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `Erro na requisição: ${res.status}`)
    }
    const data = await res.json()
    return keysToCamelCase(data)
  } catch (error) {
    console.error(`[API Request] Error on ${endpoint}:`, error)
    throw error
  }
}

// Funções de acesso aos dados
export const DataService = {
  // Lotes
  async getLotes(): Promise<Lote[]> {
    return await apiRequest('lotes')
  },
  
  async saveLote(lote: Lote): Promise<Lote> {
    const { id, user_id, userId, created_at, createdAt, updated_at, updatedAt, ...rest } = lote
    console.log("[DataService.saveLote] Sending to API:", id ? "PUT" : "POST", { id, rest })
    if (id) {
      await apiRequest(`lotes/${id}`, 'PUT', rest)
    } else {
      await apiRequest('lotes', 'POST', rest)
    }
    return lote
  },

  async deleteLote(id: string): Promise<void> {
    await apiRequest(`lotes/${id}`, 'DELETE')
  },

  // Visitas Veterinárias
  async getVisitas(): Promise<VisitaVeterinaria[]> {
    return await apiRequest('visitas-veterinarias')
  },
  async getVisitasVeterinarias(): Promise<VisitaVeterinaria[]> {
    return await this.getVisitas()
  },
  
  async saveVisita(visita: VisitaVeterinaria): Promise<VisitaVeterinaria> {
    const { id, ...rest } = visita
    if (id) {
      await apiRequest('visitas-veterinarias', 'POST', rest)
    } else {
      await apiRequest('visitas-veterinarias', 'POST', rest)
    }
    return visita
  },
  async saveVisitaVeterinaria(visita: VisitaVeterinaria): Promise<VisitaVeterinaria> {
    return await this.saveVisita(visita)
  },

  async deleteVisita(id: string): Promise<void> {
    return apiRequest(`visitas-veterinarias/${id}`, 'DELETE')
  },

  // Manejo
  async getManejoDia(): Promise<ManejoDia> {
    const manejoData = await apiRequest('manejo-diario')
    const manejoDia: ManejoDia = {}
    
    manejoData.forEach((item: any) => {
      const periodo = item.periodo as 'manha' | 'tarde'
      if (!manejoDia[item.data]) {
        manejoDia[item.data] = {}
      }
      manejoDia[item.data][periodo] = {
        status: item.status,
        loteId: item.loteId,
        lote_id: item.loteId,
        ovos: item.ovos,
        ovosDanificados: item.ovosDanificados,
        ovos_danificados: item.ovosDanificados,
        racao: item.racao,
        agua: item.agua,
        porta: item.porta,
        outros: item.outros,
        pesoOvos: item.pesoOvos,
        peso_ovos: item.pesoOvos,
        classificacao: item.classificacao
      }
    })
    
    return manejoDia
  },

  async saveManejo(data: string, periodo: 'manha' | 'tarde', manejo: Manejo): Promise<ManejoDia> {
    await apiRequest('manejo-diario', 'POST', {
      data,
      periodo,
      ...manejo
    })
    
    const estoque = await DataService.getEstoque()
    const novoOvos = estoque.ovos + manejo.ovos - (manejo.ovos_danificados || 0)
    await DataService.saveEstoque({ ...estoque, ovos: novoOvos })
    
    return DataService.getManejoDia()
  },

  async deleteManejo(id: string): Promise<void> {
    return apiRequest(`manejo-diario/${id}`, 'DELETE')
  },

  // Estoque
  async getEstoque(): Promise<Estoque> {
    return await apiRequest('estoque')
  },
  
  async saveEstoque(estoque: Estoque): Promise<Estoque> {
    await apiRequest('estoque', 'POST', estoque)
    return estoque
  },

  // Aplicações de Saúde
  async getAplicacoesSaude(): Promise<AplicacaoSaude[]> {
    return await apiRequest('aplicacoes-saude')
  },
  
  async saveAplicacaoSaude(aplicacao: AplicacaoSaude): Promise<AplicacaoSaude> {
    const { id, ...rest } = aplicacao
    if (id) {
      // Tentativa de PUT, mas se a API não tiver, vamos usar POST (ainda não temos endpoint PUT para aplicacoes)
      await apiRequest('aplicacoes-saude', 'POST', rest)
    } else {
      await apiRequest('aplicacoes-saude', 'POST', rest)
    }
    return aplicacao
  },

  async deleteAplicacaoSaude(id: string): Promise<void> {
    return apiRequest(`aplicacoes-saude/${id}`, 'DELETE')
  },

  // Mortalidade
  async getMortalidade(): Promise<Mortalidade[]> {
    return await apiRequest('mortalidade')
  },
  
  async saveMortalidade(mortalidade: Mortalidade): Promise<Mortalidade> {
    const { id, ...rest } = mortalidade
    if (id) {
      await apiRequest('mortalidade', 'POST', rest)
    } else {
      await apiRequest('mortalidade', 'POST', rest)
    }
    
    const estoque = await DataService.getEstoque()
    const novoGalinhasVivas = Math.max(0, estoque.galinhas_vivas - mortalidade.quantidade)
    await DataService.saveEstoque({ ...estoque, galinhas_vivas: novoGalinhasVivas })
    
    return mortalidade
  },

  async deleteMortalidade(id: string): Promise<void> {
    return apiRequest(`mortalidade/${id}`, 'DELETE')
  },

  // Clientes
  async getClientes(): Promise<Cliente[]> {
    return await apiRequest('clientes')
  },
  
  async saveCliente(cliente: Cliente): Promise<Cliente> {
    await apiRequest('clientes', 'POST', cliente)
    return cliente
  },

  async deleteCliente(id: string): Promise<void> {
    return apiRequest(`clientes/${id}`, 'DELETE')
  },

  // Fornecedores
  async getFornecedores(): Promise<Fornecedor[]> {
    return await apiRequest('fornecedores')
  },
  
  async saveFornecedor(fornecedor: Fornecedor): Promise<Fornecedor> {
    await apiRequest('fornecedores', 'POST', fornecedor)
    return fornecedor
  },

  async deleteFornecedor(id: string): Promise<void> {
    return apiRequest(`fornecedores/${id}`, 'DELETE')
  },

  // Vendas
  async getVendas(): Promise<Venda[]> {
    return await apiRequest('vendas')
  },
  
  async saveVenda(venda: Venda): Promise<Venda> {
    await apiRequest('vendas', 'POST', venda)
    
    const estoque = await DataService.getEstoque()
    if (venda.produto === 'ovos') {
      await DataService.saveEstoque({
        ...estoque,
        ovos: Math.max(0, estoque.ovos - venda.quantidade)
      })
    }
    
    return venda
  },

  async deleteVenda(id: string): Promise<void> {
    return apiRequest(`vendas/${id}`, 'DELETE')
  },

  // Compras
  async getCompras(): Promise<Compra[]> {
    return await apiRequest('compras')
  },
  
  async saveCompra(compra: Compra): Promise<Compra> {
    await apiRequest('compras', 'POST', compra)
    return compra
  },

  async deleteCompra(id: string): Promise<void> {
    return apiRequest(`compras/${id}`, 'DELETE')
  },

  // Alertas
  async getAlertas(): Promise<string[]> {
    const alertas: string[] = []
    const hoje = new Date().toISOString().split('T')[0]

    const aplicacoes = await DataService.getAplicacoesSaude()
    aplicacoes.forEach((a) => {
      if (a.data_proxima) {
        const dataProxima = new Date(a.data_proxima)
        const diffDays = Math.ceil((dataProxima.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays <= 7 && diffDays >= 0) {
          alertas.push(`Próxima dose de ${a.nome} (Lote ${a.lote_id}) em ${diffDays} dias`)
        }
      }
    })

    const estoque = await DataService.getEstoque()
    if (estoque.ovos < 50) alertas.push('Estoque de ovos baixo (< 50 unidades)!')
    if (estoque.galinhas_vivas < 10) alertas.push('Estoque de galinhas vivas baixo (< 10)!')

    const manejoDia = await DataService.getManejoDia()
    if (!manejoDia[hoje]?.manha) alertas.push('Manejo da manhã pendente!')
    if (!manejoDia[hoje]?.tarde) alertas.push('Manejo da tarde pendente!')

    return alertas
  },

  // Dicas: feedback e preferências (ainda usando localStorage por enquanto)
  getTipFeedbacks(): TipFeedback[] {
    try {
      if (typeof window === "undefined") return []
      const item = window.localStorage.getItem("tip_feedbacks")
      return item ? JSON.parse(item) : []
    } catch { return [] }
  },
  
  saveTipFeedback(fb: TipFeedback): TipFeedback {
    if (typeof window === "undefined") return fb
    const list = DataService.getTipFeedbacks()
    list.push(fb)
    window.localStorage.setItem("tip_feedbacks", JSON.stringify(list))
    return fb
  },
  
  getTipPreferences(): TipPreferences {
    try {
      if (typeof window === "undefined") return { dismissed: [], irrelevant: [], last_shown: {} }
      const item = window.localStorage.getItem("tip_preferences")
      return item ? JSON.parse(item) : { dismissed: [], irrelevant: [], last_shown: {} }
    } catch { return { dismissed: [], irrelevant: [], last_shown: {} } }
  },
  
  saveTipPreferences(prefs: TipPreferences): TipPreferences {
    if (typeof window === "undefined") return prefs
    window.localStorage.setItem("tip_preferences", JSON.stringify(prefs))
    return prefs
  },
  
  dismissTipTemporarily(id: string): void {
    const prefs = DataService.getTipPreferences()
    if (!prefs.dismissed.includes(id)) {
      prefs.dismissed.push(id)
    }
    DataService.saveTipPreferences(prefs)
  },
  
  markTipIrrelevant(id: string): void {
    const prefs = DataService.getTipPreferences()
    if (!prefs.irrelevant.includes(id)) {
      prefs.irrelevant.push(id)
    }
    DataService.saveTipPreferences(prefs)
  },
  
  setTipLastShown(id: string, ts: number): void {
    const prefs = DataService.getTipPreferences()
    if (prefs.last_shown) {
      prefs.last_shown[id] = ts
    }
    DataService.saveTipPreferences(prefs)
  },

  // Audit Logs (local por enquanto)
  getAuditLogs(): AuditLog[] {
    try {
      if (typeof window === "undefined") return []
      const item = window.localStorage.getItem("audit_logs")
      return item ? JSON.parse(item) : []
    } catch { return [] }
  },
  
  saveAuditLog(log: AuditLog): AuditLog {
    if (typeof window === "undefined") return log
    const logs = DataService.getAuditLogs()
    logs.push(log)
    window.localStorage.setItem("audit_logs", JSON.stringify(logs))
    return log
  },

  async loadClientesFromSupabase(): Promise<Cliente[]> {
    return DataService.getClientes()
  },

  async testSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await apiRequest('status/supabase')
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  },

  async forceSync(): Promise<void> {
    console.log('Sync service is disabled - using direct API calls')
  },

  getSyncStatus() {
    return { pendingItems: 0, lastSync: null }
  },

  // Ingredientes
  async getIngredientes(): Promise<Ingrediente[]> {
    return apiRequest('ingredientes')
  },
  
  async saveIngrediente(ingrediente: Ingrediente): Promise<Ingrediente> {
    return apiRequest('ingredientes', 'POST', ingrediente)
  },
  
  async deleteIngrediente(id: string): Promise<void> {
    return apiRequest(`ingredientes/${id}`, 'DELETE')
  },

  // Formulacoes
  async getFormulacoes(): Promise<Formulacao[]> {
    return apiRequest('formulacoes')
  },
  
  async saveFormulacao(formulacao: Formulacao): Promise<Formulacao> {
    return apiRequest('formulacoes', 'POST', formulacao)
  },
  
  async deleteFormulacao(id: string): Promise<void> {
    return apiRequest(`formulacoes/${id}`, 'DELETE')
  },

  // Estoque Racoes
  async getEstoqueRacoes(): Promise<EstoqueRacao[]> {
    return apiRequest('estoque-racoes')
  },
  
  async saveEstoqueRacao(estoque: EstoqueRacao): Promise<EstoqueRacao> {
    return apiRequest('estoque-racoes', 'POST', estoque)
  },
  
  async deleteEstoqueRacao(id: string): Promise<void> {
    return apiRequest(`estoque-racoes/${id}`, 'DELETE')
  }
}

// Type exports (added new types above
export interface Ingrediente {
  id?: string
  user_id?: string
  nome: string
  proteina: number
  energia: number
  calcio: number
  fosforo: number
  metionina: number
  lisina: number
  fibra: number
  preco: number
  estoque: number
  created_at?: string
  updated_at?: string
}

export interface ItemFormulacao {
  id?: string
  formulacao_id?: string
  ingrediente_id: string
  percentual: number
  created_at?: string
  updated_at?: string
}

export interface Formulacao {
  id?: string
  user_id?: string
  nome: string
  descricao?: string
  fase: 'inicial' | 'crescimento' | 'postura'
  ativa: boolean
  duracao_dias?: number
  quantidade_total?: number
  consumo_diario?: number
  lote_id?: string
  ajuste_ambiental?: any
  data_termino_prevista?: string
  created_at?: string
  updated_at?: string
  itens?: ItemFormulacao[]
}

export interface EstoqueRacao {
  id?: string
  user_id?: string
  formulacao_id?: string
  nome: string
  quantidade: number
  fase: 'inicial' | 'crescimento' | 'postura'
  created_at?: string
  updated_at?: string
}
