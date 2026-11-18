export type CurrencySymbol = 'S/' | '$' | '€' | 'Bs' | 'Q'

export type SocioStatusCode = 'activo' | 'por_vencer' | 'vencido'

export interface SocioStatus {
  code: SocioStatusCode
  label: string
  daysLeft: number
  badgeClass: string
}

export interface Plan {
  id: string
  nombre: string
  dias: number
  precio: number
  desc?: string
}

export interface Socio {
  id: string
  nombre: string
  dni: string
  telefono?: string
  planId: string
  inicio: string // YYYY-MM-DD
  fin: string    // YYYY-MM-DD
}

export interface Asistencia {
  id: string
  fecha: string // YYYY-MM-DD
  hora: string  // HH:mm
  socioId: string
  nombre: string
  dni: string
  estado: SocioStatusCode
}

export type MovimientoTipo = 'ingreso' | 'egreso'

export interface Movimiento {
  id: string
  fecha: string
  hora: string
  tipo: MovimientoTipo
  concepto: string
  categoria: string
  metodo: string
  monto: number
}

export type ProductoCategoria = 'Bebida' | 'Suplemento' | 'Accesorio' | 'Snack'

export interface Producto {
  id: string
  nombre: string
  categoria: string
  precio: number
  costo?: number        // 👈 Agregado para el costo de compra
  stock: number
  stockMinimo?: number  // 👈 Agregado para la alerta de stock
}

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'warning' | 'error'
}
