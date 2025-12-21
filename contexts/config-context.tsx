"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { BackupService } from "@/services/backup-service"

// Tipos para as configurações
export interface SystemConfig {
  tema: "claro" | "escuro"
  notificacoes: {
    alertasEstoque: boolean
    lembretesManejos: boolean
    aplicacoesSaude: boolean
    relatoriosSemanal: boolean
  }
  unidades: {
    peso: "kg" | "g"
    temperatura: "celsius" | "fahrenheit"
    moeda: "BRL" | "USD" | "EUR"
  }
  sistema: {
    diasAlertaEstoqueBaixo: string
    quantidadeEstoqueBaixoOvos: string
    quantidadeEstoqueBaixoAves: string
    precoDefaultOvos: string
    precoDefaultGalinhasVivas: string
    precoDefaultGalinhasLimpas: string
    precoDefaultCamaAves: string
  }
  clima: {
    provedor: "open-meteo" | "openweather"
    apiKey: string
  }
}

// Valores padrão
const defaultConfig: SystemConfig = {
  tema: "claro",
  notificacoes: {
    alertasEstoque: true,
    lembretesManejos: true,
    aplicacoesSaude: true,
    relatoriosSemanal: false,
  },
  unidades: {
    peso: "kg",
    temperatura: "celsius",
    moeda: "BRL",
  },
  sistema: {
    diasAlertaEstoqueBaixo: "7",
    quantidadeEstoqueBaixoOvos: "50",
    quantidadeEstoqueBaixoAves: "10",
    precoDefaultOvos: "0.50",
    precoDefaultGalinhasVivas: "20.00",
    precoDefaultGalinhasLimpas: "25.00",
    precoDefaultCamaAves: "5.00",
  },
  clima: {
    provedor: "open-meteo",
    apiKey: "",
  },
}

// Interface do contexto
interface ConfigContextType {
  config: SystemConfig
  updateConfig: (newConfig: Partial<SystemConfig>) => void
  updateNotificacoes: (key: keyof SystemConfig["notificacoes"], value: boolean) => void
  updateUnidades: <K extends keyof SystemConfig["unidades"]>(key: K, value: SystemConfig["unidades"][K]) => void
  updateSistema: (key: keyof SystemConfig["sistema"], value: string) => void
  setTema: (tema: "claro" | "escuro") => void
  updateClima: <K extends keyof SystemConfig["clima"]>(key: K, value: SystemConfig["clima"][K]) => void
}

// Criar o contexto
const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

// Provider component
export function ConfigProvider({ children }: { children: ReactNode }) {
  const envApiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ""
  const [config, setConfig] = useState<SystemConfig>(() => {
    const base = { ...defaultConfig }
    if (!base.clima.apiKey && envApiKey) {
      base.clima = { ...base.clima, apiKey: envApiKey, provedor: "openweather" }
    }
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("configuracoes")
        if (saved) {
          const parsed = JSON.parse(saved)
          return { ...base, ...parsed }
        }
      }
    } catch {}
    return base
  })

  useEffect(() => {
    BackupService.initAutoBackupListener()
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("configuracoes", JSON.stringify(config))
      }
    } catch {}
  }, [config])

  // Aplicar tema quando mudar
  useEffect(() => {
    document.documentElement.classList.toggle("dark", config.tema === "escuro")
  }, [config.tema])

  // Atualizar configurações
  const updateConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig((prevConfig) => {
      const updatedConfig = { ...prevConfig, ...newConfig }
      localStorage.setItem("configuracoes", JSON.stringify(updatedConfig))
      return updatedConfig
    })
  }

  // Atualizar notificações
  const updateNotificacoes = (key: keyof SystemConfig["notificacoes"], value: boolean) => {
    setConfig((prevConfig) => {
      const updatedConfig = {
        ...prevConfig,
        notificacoes: {
          ...prevConfig.notificacoes,
          [key]: value,
        },
      }
      localStorage.setItem("configuracoes", JSON.stringify(updatedConfig))
      return updatedConfig
    })
  }

  // Atualizar unidades
  const updateUnidades = <K extends keyof SystemConfig["unidades"]>(key: K, value: SystemConfig["unidades"][K]) => {
    setConfig((prevConfig) => {
      const updatedConfig = {
        ...prevConfig,
        unidades: {
          ...prevConfig.unidades,
          [key]: value,
        },
      }
      localStorage.setItem("configuracoes", JSON.stringify(updatedConfig))
      return updatedConfig
    })
  }

  // Atualizar sistema
  const updateSistema = (key: keyof SystemConfig["sistema"], value: string) => {
    setConfig((prevConfig) => {
      const updatedConfig = {
        ...prevConfig,
        sistema: {
          ...prevConfig.sistema,
          [key]: value,
        },
      }
      localStorage.setItem("configuracoes", JSON.stringify(updatedConfig))
      return updatedConfig
    })
  }

  // Atualizar clima
  const updateClima = <K extends keyof SystemConfig["clima"]>(key: K, value: SystemConfig["clima"][K]) => {
    setConfig((prevConfig) => {
      const updatedConfig = {
        ...prevConfig,
        clima: {
          ...prevConfig.clima,
          [key]: value,
        },
      }
      localStorage.setItem("configuracoes", JSON.stringify(updatedConfig))
      return updatedConfig
    })
  }

  // Atualizar tema
  const setTema = (tema: "claro" | "escuro") => {
    setConfig((prevConfig) => {
      const updatedConfig = {
        ...prevConfig,
        tema,
      }
      localStorage.setItem("configuracoes", JSON.stringify(updatedConfig))
      return updatedConfig
    })
  }

  return (
    <ConfigContext.Provider
      value={{
        config,
        updateConfig,
        updateNotificacoes,
        updateUnidades,
        updateSistema,
        setTema,
        updateClima,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

// Hook para usar o contexto
export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error("useConfig deve ser usado dentro de um ConfigProvider")
  }
  return context
}
