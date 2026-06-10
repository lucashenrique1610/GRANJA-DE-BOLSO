/**
 * Formata um número com separadores de milhar
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("pt-BR").format(num)
}

/**
 * Formata um valor para moeda (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Formata um valor para porcentagem
 */
export function formatPercent(value: number, decimalPlaces = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value / 100)
}

/**
 * Formata um número com unidade de medida
 */
export function formatWithUnit(value: number, unit: string, decimalPlaces = 2): string {
  return `${value.toFixed(decimalPlaces)} ${unit}`
}

/**
 * Formata um número de telefone/celular
 */
export function formatPhone(input: string): string {
  let value = input.replace(/\D/g, "")
  if (value.length > 2) value = "(" + value.slice(0, 2) + ") " + value.slice(2)
  if (value.length > 9) value = value.slice(0, 9) + "-" + value.slice(9)
  return value.slice(0, 15)
}

/**
 * Formata um CPF
 */
export function formatCPF(input: string): string {
  let value = input.replace(/\D/g, "")
  if (value.length > 3) value = value.slice(0, 3) + "." + value.slice(3)
  if (value.length > 7) value = value.slice(0, 7) + "." + value.slice(7)
  if (value.length > 11) value = value.slice(0, 11) + "-" + value.slice(11)
  return value.slice(0, 14)
}

/**
 * Formata um CNPJ
 */
export function formatCNPJ(input: string): string {
  let value = input.replace(/\D/g, "")
  if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2)
  if (value.length > 6) value = value.slice(0, 6) + "." + value.slice(6)
  if (value.length > 10) value = value.slice(0, 10) + "/" + value.slice(10)
  if (value.length > 15) value = value.slice(0, 15) + "-" + value.slice(15)
  return value.slice(0, 18)
}
