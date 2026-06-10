import type { SystemConfig } from "@/contexts/config-context"

// Valores padrão
export const defaultConfig: SystemConfig = {
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
  supabase: {
    url: "",
    anonKey: "",
  },
}

// Funções para formatar valores de acordo com as configurações
export const ConfigService = {
  formatCurrency: (value: number, config: SystemConfig): string => {
    const currencies = {
      BRL: { locale: "pt-BR", currency: "BRL", symbol: "R$" },
      USD: { locale: "en-US", currency: "USD", symbol: "$" },
      EUR: { locale: "de-DE", currency: "EUR", symbol: "€" },
    }

    const currencyConfig = currencies[config.unidades.moeda as keyof typeof currencies]

    return new Intl.NumberFormat(currencyConfig.locale, {
      style: "currency",
      currency: currencyConfig.currency,
    }).format(value)
  },

  formatWeight: (value: number, config: SystemConfig): string => {
    if (config.unidades.peso === "g") {
      // Converter kg para g se necessário
      const valueInGrams = value * 1000
      return `${valueInGrams.toFixed(0)}g`
    }
    return `${value.toFixed(2)}kg`
  },

  formatTemperature: (value: number, config: SystemConfig): string => {
    if (config.unidades.temperatura === "fahrenheit") {
      // Converter Celsius para Fahrenheit
      const valueInFahrenheit = (value * 9) / 5 + 32
      return `${valueInFahrenheit.toFixed(1)}°F`
    }
    return `${value.toFixed(1)}°C`
  },

  // Verificar se deve mostrar alertas com base nas configurações
  shouldShowAlert: (type: keyof SystemConfig["notificacoes"], config: SystemConfig): boolean => {
    return config.notificacoes[type]
  },

  // Verificar se o estoque está baixo com base nas configurações
  isLowStock: (
    type: "ovos" | "galinhas_vivas" | "galinhas_limpas",
    quantity: number,
    config: SystemConfig,
  ): boolean => {
    if (type === "ovos") {
      return quantity < Number(config.sistema.quantidadeEstoqueBaixoOvos)
    }
    if (type === "galinhas_vivas") {
      return quantity < Number(config.sistema.quantidadeEstoqueBaixoAves)
    }
    return false
  },

  // Obter preço padrão para um produto
  getDefaultPrice: (product: string, config: SystemConfig): number => {
    switch (product) {
      case "ovos":
        return Number(config.sistema.precoDefaultOvos)
      case "galinhas_vivas":
        return Number(config.sistema.precoDefaultGalinhasVivas)
      case "galinhas_limpas":
        return Number(config.sistema.precoDefaultGalinhasLimpas)
      case "cama_aves":
        return Number(config.sistema.precoDefaultCamaAves)
      default:
        return 0
    }
  },
}
