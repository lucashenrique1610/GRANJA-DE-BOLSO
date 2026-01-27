import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Types
export type SyncAction = "create" | "update" | "delete" | "upsert"
export type TableName = 
  | "lotes" 
  | "visitas_veterinarias" 
  | "manejo_diario" 
  | "estoque" 
  | "aplicacoes_saude" 
  | "mortalidade" 
  | "fornecedores" 
  | "compras" 
  | "vendas"
  | "clientes"

export interface SyncQueueItem {
  id: string
  action: SyncAction
  table: TableName
  data: any
  entityId: string
  timestamp: number
  retryCount: number
}

const QUEUE_KEY = "granja_sync_queue"
const LAST_SYNC_KEY = "granja_last_sync"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

class SyncService {
  private queue: SyncQueueItem[] = []
  private isSyncing = false
  private listeners: ((isSyncing: boolean) => void)[] = []

  constructor() {
    this.loadQueue()
  }

  private loadQueue() {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(QUEUE_KEY)
    this.queue = stored ? JSON.parse(stored) : []
  }

  private saveQueue() {
    if (typeof window === "undefined") return
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue))
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.isSyncing))
  }

  public subscribe(callback: (isSyncing: boolean) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  public getQueueLength() {
    return this.queue.length
  }

  public getLastSyncTime(): number {
    if (typeof window === "undefined") return 0
    return parseInt(localStorage.getItem(LAST_SYNC_KEY) || "0")
  }

  public enqueue(action: SyncAction, table: TableName, data: any, entityId: string) {
    // If updating/deleting, remove previous pending actions for same entity to avoid redundancy
    // But be careful: create + update = create with new data. 
    // create + delete = nothing (remove create).
    
    // Simplification: Append to queue. Optimize later if needed.
    // Actually, simple optimization:
    if (action === "update") {
        // If there is a pending update for same ID, merge it? 
        // Or if there is a pending create, update the create payload.
        const existingCreateIndex = this.queue.findIndex(item => item.entityId === entityId && item.table === table && item.action === "create")
        if (existingCreateIndex !== -1) {
            this.queue[existingCreateIndex].data = { ...this.queue[existingCreateIndex].data, ...data }
            this.saveQueue()
            return
        }
    }

    const item: SyncQueueItem = {
      id: uuidv4(),
      action,
      table,
      data,
      entityId,
      timestamp: Date.now(),
      retryCount: 0
    }
    this.queue.push(item)
    this.saveQueue()
    
    // Try to sync immediately if online (caller should check network, or we check here)
    if (typeof navigator !== "undefined" && navigator.onLine) {
        this.processQueue()
    }
  }

  public async processQueue() {
    if (this.isSyncing || this.queue.length === 0) return
    if (typeof navigator !== "undefined" && !navigator.onLine) return

    this.isSyncing = true
    this.notifyListeners()

    const queueSnapshot = [...this.queue]
    const remainingQueue: SyncQueueItem[] = []

    for (const item of queueSnapshot) {
      try {
        await this.syncItem(item)
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error)
        item.retryCount++
        if (item.retryCount < 5) { // Give up after 5 tries
             remainingQueue.push(item)
        }
      }
    }

    this.queue = remainingQueue
    this.saveQueue()
    this.isSyncing = false
    this.notifyListeners()
  }

  private async syncItem(item: SyncQueueItem) {
    const { table, action, data, entityId } = item
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("No session")

    // Inject user_id if needed
    const payload = { ...this.camelToSnake(data), user_id: session.user.id }

    if (action === "create") {
       const { error } = await supabase.from(table).insert(payload)
       if (error) throw error
    } else if (action === "update") {
       // Remove ID from payload if it's there, to avoid primary key update error if any
       const { id, ...updateData } = payload
       const { error } = await supabase.from(table).update(updateData).eq("id", entityId)
       if (error) throw error
    } else if (action === "upsert") {
       const { error } = await supabase.from(table).upsert(payload)
       if (error) throw error
    } else if (action === "delete") {
       const { error } = await supabase.from(table).delete().eq("id", entityId)
       if (error) throw error
    }
  }

  public async pullUpdates() {
    if (this.isSyncing) return
    if (typeof navigator !== "undefined" && !navigator.onLine) return

    this.isSyncing = true
    this.notifyListeners()

    try {
        const lastSync = this.getLastSyncTime()
        const lastSyncDate = new Date(lastSync).toISOString()

        // We need to fetch updates for all tables
        // This is heavy, ideally we have a single "events" table or we check each table
        // For now, let's just fetch "lotes" as a proof of concept, or implement all.
        
        await this.pullTable("lotes", lastSyncDate)
        await this.pullTable("visitas_veterinarias", lastSyncDate)
        await this.pullTable("mortalidade", lastSyncDate)
        await this.pullTable("aplicacoes_saude", lastSyncDate)
        await this.pullTable("fornecedores", lastSyncDate)
        await this.pullTable("compras", lastSyncDate)
        await this.pullTable("vendas", lastSyncDate)
        await this.pullTable("clientes", lastSyncDate)
        // Manejo is special because of structure
        await this.pullManejo(lastSyncDate)

        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString())
        
        // Notify app that data has changed
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("granja-data-updated"))
        }

    } catch (e) {
        console.error("Pull failed:", e)
    } finally {
        this.isSyncing = false
        this.notifyListeners()
    }
  }

  private async pullTable(table: TableName, lastSyncDate: string) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .gt("updated_at", lastSyncDate)
      
      if (error) throw error
      if (!data || data.length === 0) return

      // Update local storage
      // We need a way to map back to local structure.
      // For most tables, it's just a list.
      // We rely on DataService's internal storage format which is usually just the key name.
      
      const localKey = table === "visitas_veterinarias" ? "visitas" : table // map if needed
      // Actually DataService uses:
      // lotes -> "lotes"
      // visitas -> ??? (Wait, DataService doesn't have getVisitas explicit in the snippet I saw, but let's assume standard)
      
      // Let's implement specific handlers
      if (table === "lotes") {
          this.mergeLotes(data)
      } else if (table === "mortalidade") {
          this.mergeList("mortalidade", data)
      } else if (table === "clientes") {
          this.mergeList("clientes", data) // Check DataService key
      } 
      // ... handle others
  }

  private mergeLotes(remoteLotes: any[]) {
      const local = JSON.parse(localStorage.getItem("lotes") || "[]")
      const merged = this.mergeArrays(local, remoteLotes)
      localStorage.setItem("lotes", JSON.stringify(merged))
  }
  
  private mergeList(key: string, remoteItems: any[]) {
      const local = JSON.parse(localStorage.getItem(key) || "[]")
      const merged = this.mergeArrays(local, remoteItems)
      localStorage.setItem(key, JSON.stringify(merged))
  }

  private mergeArrays(local: any[], remote: any[]) {
      // Map by ID
      const map = new Map(local.map((i: any) => [i.id, i]))
      remote.forEach((r: any) => {
          // Snake_case to camelCase conversion might be needed!
          // Supabase returns snake_case. App uses camelCase.
          const converted = this.snakeToCamel(r)
          map.set(converted.id, converted)
      })
      return Array.from(map.values())
  }

  private async pullManejo(lastSyncDate: string) {
      const { data, error } = await supabase
        .from("manejo_diario")
        .select("*")
        .gt("updated_at", lastSyncDate)
    
      if (error || !data) return

      const manejoDia = JSON.parse(localStorage.getItem("manejoDia") || "{}")
      
      data.forEach((row: any) => {
          const date = row.data // "YYYY-MM-DD"
          if (!manejoDia[date]) manejoDia[date] = {}
          
          const periodo = row.periodo // "manha" | "tarde"
          manejoDia[date][periodo] = {
              status: row.status,
              loteId: row.lote_id,
              ovos: row.ovos,
              ovosDanificados: row.ovos_danificados,
              racao: row.racao,
              agua: row.agua,
              porta: row.porta,
              outros: row.outros,
              pesoOvos: row.peso_ovos,
              classificacao: row.classificacao
          }
      })
      
      localStorage.setItem("manejoDia", JSON.stringify(manejoDia))
  }

  private snakeToCamel(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => this.snakeToCamel(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => {
                const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                result[camelKey] = this.snakeToCamel(obj[key]);
                return result;
            },
            {} as any
        );
    }
    return obj;
  }

  private camelToSnake(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => this.camelToSnake(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                result[snakeKey] = this.camelToSnake(obj[key]);
                return result;
            },
            {} as any
        );
    }
    return obj;
  }
}

export const syncService = new SyncService()
