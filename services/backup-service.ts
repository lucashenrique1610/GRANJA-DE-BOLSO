// Service now uses backend APIs exclusively
// No direct Supabase client imports needed

// Helper to get session token from localStorage
async function getSessionToken(): Promise<string | null> {
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

export interface BackupMetadata {
  id: string
  created_at: string
  size: number
  version: string
  note?: string
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export const BackupService = {
  async generateKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    )
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    )
  },

  async encryptData(data: any, password: string): Promise<{ encrypted: string; salt: string; iv: string }> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const key = await BackupService.generateKeyFromPassword(password, salt)
    
    const enc = new TextEncoder()
    const encodedData = enc.encode(JSON.stringify(data))
    
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedData
    )

    return {
      encrypted: arrayBufferToBase64(encryptedContent),
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv)
    }
  },

  async decryptData(encrypted: string, salt: string, iv: string, password: string): Promise<any> {
    const s = new Uint8Array(base64ToArrayBuffer(salt))
    const i = new Uint8Array(base64ToArrayBuffer(iv))
    const e = base64ToArrayBuffer(encrypted)
    
    const key = await BackupService.generateKeyFromPassword(password, s)
    
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: i },
      key,
      e
    )
    
    const dec = new TextDecoder()
    return JSON.parse(dec.decode(decryptedContent))
  },

  async listBackups(): Promise<BackupMetadata[]> {
    const token = await getSessionToken()
    if (!token) throw new Error("Usuário não autenticado")

    const res = await fetch("/api/backup/list", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Falha ao listar backups")
    }
    
    return res.json()
  },

  async createBackup(password: string, note?: string): Promise<void> {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Ambiente inseguro: Criptografia requer HTTPS ou localhost.")
    }

    const token = await getSessionToken()
    if (!token) throw new Error("Usuário não autenticado")

    // Coletar dados do localStorage
    const keys = Object.keys(localStorage)
    const rawData: Record<string, any> = {}
    keys.forEach(k => {
        // Ignorar tokens de sessão do supabase ou chaves irrelevantes
        if (!k.startsWith("sb-") && k !== "backup_auto_config" && k !== "backup_auto_key") {
             const val = localStorage.getItem(k)
             try {
                rawData[k] = JSON.parse(val || "null")
             } catch {
                rawData[k] = val
             }
        }
    })

    const { encrypted, salt, iv } = await BackupService.encryptData(rawData, password)
    const size = encrypted.length

    const res = await fetch("/api/backup/create", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            data: encrypted,
            salt,
            iv,
            size,
            version: "2.0",
            note
        })
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Falha ao criar backup")
    }
  },

  async restoreBackup(id: string, password: string): Promise<void> {
    const token = await getSessionToken()
    if (!token) throw new Error("Usuário não autenticado")

    const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Falha ao baixar backup")
    }

    const data = await res.json()
    
    let restoredData: any;

    if (data.version === "2.0") {
        if (!data.salt || !data.iv) throw new Error("Dados de criptografia ausentes no backup")
        restoredData = await BackupService.decryptData(data.data, data.salt, data.iv, password)
    } else {
        // Fallback para versão antiga
        if (typeof data.data === 'string') {
             try {
                 restoredData = JSON.parse(data.data)
             } catch {
                 restoredData = data.data
             }
        } else {
             restoredData = data.data
        }
    }
    
    // Aplicar dados
    Object.keys(restoredData).forEach(k => {
        if (typeof restoredData[k] === 'object') {
            localStorage.setItem(k, JSON.stringify(restoredData[k]))
        } else {
            localStorage.setItem(k, String(restoredData[k]))
        }
    })
    
    window.location.reload()
  },

  async cleanupOldBackups(retentionDays: number): Promise<void> {
    const token = await getSessionToken()
    if (!token) return

    await fetch("/api/backup/cleanup", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ retentionDays })
    })
  },

  async checkAndRunAutoBackup(): Promise<void> {
      if (typeof window === "undefined") return
      
      const configRaw = localStorage.getItem("backup_auto_config")
      const keyRaw = localStorage.getItem("backup_auto_key")
      
      if (!configRaw || !keyRaw) return
      
      try {
          const config = JSON.parse(configRaw) as { frequency: "daily" | "weekly", lastBackup: number, retention?: number }
          const now = Date.now()
          const oneDay = 24 * 60 * 60 * 1000
          
          let shouldRun = false
          if (config.frequency === "daily" && now - config.lastBackup > oneDay) shouldRun = true
          if (config.frequency === "weekly" && now - config.lastBackup > 7 * oneDay) shouldRun = true
          
          if (shouldRun) {
              await BackupService.createBackup(keyRaw, "Backup Automático")
              
              if (config.retention) {
                  await BackupService.cleanupOldBackups(config.retention)
              }
              
              config.lastBackup = now
              localStorage.setItem("backup_auto_config", JSON.stringify(config))
              console.log("Backup automático realizado com sucesso")
          }
      } catch (e) {
          console.error("Falha no backup automático", e)
      }
  },

  initAutoBackupListener(): void {
    if (typeof window === "undefined") return

    // Run on startup
    BackupService.checkAndRunAutoBackup()

    // Run when coming online
    window.addEventListener('online', () => {
        console.log("Conexão restabelecida. Verificando backups pendentes...")
        BackupService.checkAndRunAutoBackup()
    })

    // Run periodically
    setInterval(() => {
        BackupService.checkAndRunAutoBackup()
    }, 60 * 60 * 1000)
  }
}
