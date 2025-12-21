/**
 * Formata uma string para o formato de data DD/MM/AAAA
 */
export function formatDateInput(input: string): string {
  let value = input.replace(/\D/g, "")
  if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2)
  if (value.length > 5) value = value.slice(0, 5) + "/" + value.slice(5)
  return value.slice(0, 10)
}

/**
 * Valida se uma string está no formato DD/MM/AAAA e representa uma data válida
 * @param date String de data no formato DD/MM/AAAA
 * @param allowFuture Se true, permite datas futuras
 */
export function validateDate(date: string, allowFuture = false): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/
  if (!regex.test(date)) return false

  const [dia, mes, ano] = date.split("/").map(Number)
  const dataInserida = new Date(ano, mes - 1, dia)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // Verifica se a data é válida (evita 31/02/2023, por exemplo)
  if (dataInserida.getDate() !== dia || dataInserida.getMonth() !== mes - 1 || dataInserida.getFullYear() !== ano)
    return false

  // Verifica se a data é futura (se não for permitido)
  if (!allowFuture && dataInserida > hoje) return false

  return true
}

/**
 * Formata uma data para exibição em formato extenso
 */
export function formatDateExtended(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return date.toLocaleDateString("pt-BR", options)
}

/**
 * Calcula a diferença em dias entre duas datas
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
}
