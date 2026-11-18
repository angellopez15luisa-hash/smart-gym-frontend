export function getTodayISO(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60 * 1000)
  return local.toISOString().split('T')[0]!
}

export function addDaysISO(dateStr: string, days: number): string {
  const parts = dateStr.split('-')
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])

  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + Number(days))

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDaysDifference(targetDateStr: string): number {
  const todayStr = getTodayISO()
  const p1 = todayStr.split('-')
  const p2 = targetDateStr.split('-')

  const t1 = new Date(Number(p1[0]), Number(p1[1]) - 1, Number(p1[2]))
  const t2 = new Date(Number(p2[0]), Number(p2[1]) - 1, Number(p2[2]))

  return Math.ceil((t2.getTime() - t1.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDateHuman(dateStr?: string): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  const y = parts[0]
  const m = Number(parts[1])
  const d = parts[2]

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d} ${meses[m - 1]} ${y}`
}

export function getCurrentTimeStr(): string {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export function addDaysToDateISO(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00')
  date.setDate(date.getDate() + days)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
