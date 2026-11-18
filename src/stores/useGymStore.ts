import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { gymService } from '@/services/gymService'
import { getTodayISO, getDaysDifference, getCurrentTimeStr } from '@/utils/dateUtils'
import type {
  CurrencySymbol, Plan, Socio, Producto, Movimiento, Asistencia, SocioStatus, ToastItem
} from '@/types/gym.types'

const STORAGE_KEY = 'gym_control_barrio_vue35_v1'

export interface EstadoCaja {
  abierta: boolean
  fechaApertura: string
  horaApertura: string
  timestampApertura: number
  montoInicial: number
}

export interface UserSession {
  username: string
  nombre: string
  rol: 'admin' | 'cajero'
}

export const useGymStore = defineStore('gym', () => {
  const currency = ref<CurrencySymbol>('S/')
  const planes = ref<Plan[]>([])
  const socios = ref<Socio[]>([])
  const productos = ref<Producto[]>([])
  const movimientos = ref<Movimiento[]>([])
  const asistencias = ref<Asistencia[]>([])
  const toasts = ref<ToastItem[]>([])
  const isLoaded = ref(false)

  // ESTADO DE SESIÓN DE USUARIO (LOGIN)
  const currentUser = ref<UserSession | null>(null)

  // ESTADO GLOBAL DE CAJA DEL DÍA (Candado para ventas)
  const cajaEstado = ref<EstadoCaja>({
    abierta: false,
    fechaApertura: '',
    horaApertura: '',
    timestampApertura: 0,
    montoInicial: 0
  })

  const socioModalState = ref<{ open: boolean; socioId: string | null }>({ open: false, socioId: null })
  const renovarModalState = ref<{ open: boolean; socioId: string | null }>({ open: false, socioId: null })

  // Estado global para controlar el modal de corte y cierre desde cualquier parte de la app
  const cierreModalGlobalOpen = ref(false)

  function abrirCorteCajaGlobal() {
    if (!cajaEstado.value.abierta) {
      notify('La caja está cerrada actualmente.', 'warning')
      return
    }
    cierreModalGlobalOpen.value = true
  }

  function cerrarCorteCajaGlobal() {
    cierreModalGlobalOpen.value = false
  }

  // --- ACCIONES DE AUTENTICACIÓN ---
  function login(username: string, pass: string): boolean {
    if (username === 'miguel.admin' && pass === '12345678') {
      currentUser.value = { username: 'miguel.admin', nombre: 'Miguel (Admin)', rol: 'admin' }
      return true
    }
    if (username === 'jorge.cashier' && pass === '12345678') {
      currentUser.value = { username: 'jorge.cashier', nombre: 'Jorge (Cajero)', rol: 'cajero' }
      return true
    }
    notify('Credenciales incorrectas. Verifica usuario y contraseña.', 'error')
    return false
  }

  function logout() {
    currentUser.value = null
    // Limpio de notificaciones automáticas al iniciar o cambiar de sesión
  }

  function notify(message: string, type: ToastItem['type'] = 'success') {
    const id = crypto.randomUUID()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3200)
  }

  async function initStore() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        currency.value = parsed.currency || 'S/'
        planes.value = parsed.planes || []
        socios.value = parsed.socios || []
        productos.value = parsed.productos || []
        movimientos.value = parsed.movimientos || []
        asistencias.value = parsed.asistencias || []
        if (parsed.cajaEstado) {
          cajaEstado.value = parsed.cajaEstado
        }
        if (parsed.currentUser) {
          currentUser.value = parsed.currentUser
        }
        isLoaded.value = true
        return
      } catch (e) {
        console.error('Error leyendo storage:', e)
      }
    }
    await resetDemoData(false)
    isLoaded.value = true
  }

  async function resetDemoData(showAlert = true) {
    const data = await gymService.getInitialData()
    currency.value = 'S/'
    planes.value = data.planes
    socios.value = data.socios
    productos.value = data.productos
    movimientos.value = data.movimientos
    asistencias.value = data.asistencias
    cajaEstado.value = {
      abierta: true,
      fechaApertura: getTodayISO(),
      horaApertura: '08:00 a. m.',
      timestampApertura: Date.now() - 3600000,
      montoInicial: 50.00
    }
    if (showAlert) notify('Datos de prueba JSON restaurados')
  }

  watch(
    [currency, planes, socios, productos, movimientos, asistencias, cajaEstado, currentUser],
    () => {
      if (!isLoaded.value) return
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currency: currency.value,
          planes: planes.value,
          socios: socios.value,
          productos: productos.value,
          movimientos: movimientos.value,
          asistencias: asistencias.value,
          cajaEstado: cajaEstado.value,
          currentUser: currentUser.value
        })
      )
    },
    { deep: true }
  )

  function formatMoney(amount: number): string {
    return `${currency.value} ${Number(amount || 0).toFixed(2)}`
  }

  function getPlanById(planId: string): Plan {
    return planes.value.find(p => p.id === planId) || { id: '', nombre: 'Plan Personalizado', dias: 30, precio: 0 }
  }

  function getSocioStatus(socio: Socio): SocioStatus {
    const daysLeft = getDaysDifference(socio.fin)
    if (daysLeft < 0) {
      return { code: 'vencido', label: 'Vencido', daysLeft, badgeClass: 'bg-rose-100 text-rose-700 border-rose-200' }
    }
    if (daysLeft <= 5) {
      return {
        code: 'por_vencer',
        label: daysLeft === 0 ? 'Vence Hoy' : `Vence en ${daysLeft}d`,
        daysLeft,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
      }
    }
    return { code: 'activo', label: 'Activo', daysLeft, badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }

  const sociosConEstado = computed(() =>
    socios.value.map(s => ({ ...s, status: getSocioStatus(s), plan: getPlanById(s.planId) }))
  )

  const stats = computed(() => {
    const today = getTodayISO()
    const monthPrefix = today.substring(0, 7)

    const activos = sociosConEstado.value.filter(s => s.status.code === 'activo').length
    const porVencer = sociosConEstado.value.filter(s => s.status.code === 'por_vencer').length
    const vencidos = sociosConEstado.value.filter(s => s.status.code === 'vencido').length

    let ingresosMes = 0
    let ingresosHoy = 0
    let totalIngresos = 0
    let totalEgresos = 0

    movimientos.value.forEach(m => {
      if (m.tipo === 'ingreso') {
        totalIngresos += m.monto
        if (m.fecha.startsWith(monthPrefix)) ingresosMes += m.monto
        if (m.fecha === today) ingresosHoy += m.monto
      } else {
        totalEgresos += m.monto
      }
    })

    const asistenciasHoy = asistencias.value.filter(a => a.fecha === today)

    return {
      activosVigentes: activos + porVencer,
      totalSocios: socios.value.length,
      porVencer,
      vencidos,
      ingresosMes,
      ingresosHoy,
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
      asistenciasHoy
    }
  })

  // --- ACCIONES DE APERTURA Y CIERRE DE CAJA ---
  function abrirCaja(montoInicial: number) {
    cajaEstado.value = {
      abierta: true,
      fechaApertura: getTodayISO(),
      horaApertura: getCurrentTimeStr(),
      timestampApertura: Date.now(),
      montoInicial: Number(montoInicial) || 0
    }
    notify('Caja abierta correctamente. Sistema habilitado para cobros.', 'success')
  }

  function cerrarCaja() {
    cajaEstado.value = {
      abierta: false,
      fechaApertura: '',
      horaApertura: '',
      timestampApertura: 0,
      montoInicial: 0
    }
    notify('Caja cerrada por el administrador.', 'warning')
  }

  // --- VALIDACIÓN DE COBROS CON CANDADO DE CAJA ---
  function addOrUpdateSocio(payload: Omit<Socio, 'id'> & { id?: string }, cobrar = false, metodo = 'Efectivo') {
    if (payload.id) {
      const idx = socios.value.findIndex(s => s.id === payload.id)
      if (idx !== -1) {
        socios.value[idx] = { ...socios.value[idx], ...payload, id: payload.id }
        notify('Datos del socio actualizados')
      }
    } else {
      if (cobrar && !cajaEstado.value.abierta) {
        notify('¡Atención! La caja está cerrada. Debes abrir caja para registrar inscripciones con cobro.', 'error')
        return
      }
      const newSocio: Socio = { ...payload, id: `soc-${Date.now()}` }
      socios.value.unshift(newSocio)
      if (cobrar) {
        const plan = getPlanById(payload.planId)
        movimientos.value.unshift({
          id: `mov-${Date.now()}`,
          fecha: getTodayISO(),
          hora: getCurrentTimeStr(),
          tipo: 'ingreso',
          concepto: `Inscripción ${plan.nombre} - ${payload.nombre}`,
          categoria: 'Membresía',
          metodo,
          monto: plan.precio
        })
      }
      notify(`Socio ${payload.nombre} registrado`)
    }
  }

  function deleteSocio(id: string) {
    socios.value = socios.value.filter(s => s.id !== id)
    notify('Socio eliminado', 'warning')
  }

  function renovarSocio(socioId: string, planId: string, inicio: string, fin: string, metodo: string) {
    if (!cajaEstado.value.abierta) {
      notify('¡Atención! La caja está cerrada. Abre la caja para procesar renovaciones.', 'error')
      return
    }

    const idx = socios.value.findIndex(s => s.id === socioId)
    if (idx === -1) return
    const socio = socios.value[idx]
    if (!socio) return

    const plan = getPlanById(planId)

    socios.value[idx] = { ...socio, planId, inicio, fin }
    movimientos.value.unshift({
      id: `mov-${Date.now()}`,
      fecha: getTodayISO(),
      hora: getCurrentTimeStr(),
      tipo: 'ingreso',
      concepto: `Renovación ${plan.nombre} - ${socio.nombre}`,
      categoria: 'Membresía',
      metodo,
      monto: plan.precio
    })
    notify(`Membresía renovada (+${formatMoney(plan.precio)})`)
  }

  function registrarAsistencia(socioId: string) {
    const socio = socios.value.find(s => s.id === socioId)
    if (!socio) return null
    const status = getSocioStatus(socio)
    const plan = getPlanById(socio.planId)
    const hora = getCurrentTimeStr()

    if (status.code !== 'vencido') {
      asistencias.value.push({
        id: `asi-${Date.now()}`,
        fecha: getTodayISO(),
        hora,
        socioId: socio.id,
        nombre: socio.nombre,
        dni: socio.dni,
        estado: status.code
      })
      notify(
        status.code === 'activo'
          ? `¡Bienvenido ${socio.nombre.split(' ')[0]}!`
          : `Acceso permitido, recordar renovación a ${socio.nombre.split(' ')[0]}`,
        status.code === 'activo' ? 'success' : 'warning'
      )
    } else {
      notify(`Membresía vencida de ${socio.nombre}`, 'error')
    }

    return { socio, status, plan, hora }
  }

  function venderProductoRapido(prodId: string) {
    if (!cajaEstado.value.abierta) {
      notify('¡Caja Cerrada! Debes abrir caja para realizar ventas en la barra.', 'error')
      return
    }

    const idx = productos.value.findIndex(p => p.id === prodId)
    if (idx === -1) return

    const prod = productos.value[idx]
    if (!prod) return

    if (prod.stock <= 0) {
      notify('Producto sin stock', 'error')
      return
    }

    prod.stock -= 1
    movimientos.value.unshift({
      id: `mov-${Date.now()}`,
      fecha: getTodayISO(),
      hora: getCurrentTimeStr(),
      tipo: 'ingreso',
      concepto: `Venta Barra: ${prod.nombre}`,
      categoria: 'Barra / Tienda',
      metodo: 'Efectivo',
      monto: prod.precio
    })
    notify(`Vendido: ${prod.nombre} (+${formatMoney(prod.precio)})`)
  }

  function checkoutBarSale(payload: {
    items: Array<{ id: string; nombre: string; precio: number; quantity: number }>
    total: number
    paymentMethod: string
    date: string
  }) {
    if (!cajaEstado.value.abierta) {
      notify('¡Imposible cobrar! La caja se encuentra cerrada.', 'error')
      return
    }

    payload.items.forEach(cartItem => {
      const prod = productos.value.find(p => p.id === cartItem.id)
      if (prod) {
        prod.stock = Math.max(0, prod.stock - cartItem.quantity)
      }
    })

    const nombresItems = payload.items.map(i => `${i.quantity}x ${i.nombre}`).join(', ')

    movimientos.value.unshift({
      id: `mov-${Date.now()}`,
      fecha: getTodayISO(),
      hora: getCurrentTimeStr(),
      tipo: 'ingreso',
      concepto: `Venta Barra POS: ${nombresItems}`,
      categoria: 'Barra / Tienda',
      metodo: payload.paymentMethod,
      monto: payload.total
    })

    notify(`¡Venta de barra registrada con éxito! (+${formatMoney(payload.total)})`)
  }

  function exportJSON() {
    const blob = new Blob(
      [JSON.stringify({ currency: currency.value, planes: planes.value, socios: socios.value, productos: productos.value, movimientos: movimientos.value, asistencias: asistencias.value, cajaEstado: cajaEstado.value }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `respaldo_gym_${getTodayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Respaldo JSON descargado')
  }

  function savePlan(payload: Omit<Plan, 'id'> & { id?: string }) {
    if (payload.id) {
      const idx = planes.value.findIndex(p => p.id === payload.id)
      if (idx !== -1) {
        planes.value[idx] = { ...payload, id: payload.id }
        notify('Plan actualizado')
      }
    } else {
      planes.value.push({ ...payload, id: `plan-${Date.now()}` })
      notify('Nuevo plan creado')
    }
  }

  function deletePlan(id: string) {
    if (planes.value.length <= 1) {
      notify('Debe existir al menos un plan activo', 'error')
      return
    }
    planes.value = planes.value.filter(p => p.id !== id)
    notify('Plan eliminado', 'warning')
  }

  return {
    currency, planes, socios, productos, movimientos, asistencias, toasts,
    cajaEstado, socioModalState, renovarModalState, cierreModalGlobalOpen, currentUser,
    sociosConEstado, stats,
    initStore, resetDemoData, formatMoney, getPlanById, getSocioStatus,
    abrirCaja, cerrarCaja, abrirCorteCajaGlobal, cerrarCorteCajaGlobal, login, logout,
    addOrUpdateSocio, deleteSocio, renovarSocio, registrarAsistencia,
    venderProductoRapido, checkoutBarSale,
    notify, exportJSON, isLoaded, savePlan, deletePlan
  }
})
