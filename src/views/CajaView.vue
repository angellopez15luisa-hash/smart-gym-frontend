<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { formatDateHuman, getTodayISO, getCurrentTimeStr } from '@/utils/dateUtils'
import BaseModal from '@/components/common/BaseModal.vue'
import type { MovimientoTipo } from '@/types/gym.types'

const store = useGymStore()

// Validación de rol activo
const isAdmin = computed(() => store.currentUser?.rol === 'admin')

// Input rápido para aperturar caja directamente desde el overlay central de la vista
const montoInicialRapido = ref<number>(50)

function handleAperturaRapida() {
  store.abrirCaja(Number(montoInicialRapido.value) || 0)
}

// Historial de cierres locales en localStorage para auditoría
interface TurnoCierre {
  id: string
  fechaApertura: string
  horaApertura: string
  fechaCierre: string
  horaCierre: string
  montoInicial: number
  efectivoEsperado: number
  efectivoContado: number
  diferencia: number
  totalYape: number
  totalPlin: number
  totalTransf: number
}

const savedHistorial = localStorage.getItem('gym_historial_cierres_caja')
const historialTurnos = ref<TurnoCierre[]>(savedHistorial ? JSON.parse(savedHistorial) : [])

function persistHistorial() {
  localStorage.setItem('gym_historial_cierres_caja', JSON.stringify(historialTurnos.value))
}

const efectivoContadoInput = ref<number>(0)

// Cálculo de estadísticas del turno activo (desde el timestamp de apertura)
const statsTurnoActual = computed(() => {
  if (!store.cajaEstado.abierta) return null

  let ingresosEfectivo = 0
  let egresosEfectivo = 0
  let yape = 0
  let plin = 0
  let transf = 0

  store.movimientos.forEach(m => {
    const parts = m.id.split('-')
    const movTime = parts[1] ? Number(parts[1]) : 0

    if (movTime >= store.cajaEstado.timestampApertura) {
      if (m.tipo === 'ingreso') {
        if (m.metodo === 'Efectivo') ingresosEfectivo += m.monto
        else if (m.metodo === 'Yape') yape += m.monto
        else if (m.metodo === 'Plin') plin += m.monto
        else if (m.metodo === 'Transferencia') transf += m.monto
      } else {
        if (m.metodo === 'Efectivo') egresosEfectivo += m.monto
      }
    }
  })

  const efectivoEsperado = store.cajaEstado.montoInicial + ingresosEfectivo - egresosEfectivo

  return {
    montoInicial: store.cajaEstado.montoInicial,
    ingresosEfectivo,
    egresosEfectivo,
    efectivoEsperado,
    yape,
    plin,
    transf
  }
})

function confirmarCierre() {
  if (!store.cajaEstado.abierta || !statsTurnoActual.value) return

  const esperado = statsTurnoActual.value.efectivoEsperado
  const contado = Number(efectivoContadoInput.value) || 0
  const diferencia = contado - esperado

  const nuevoCierre: TurnoCierre = {
    id: `cierre-${Date.now()}`,
    fechaApertura: store.cajaEstado.fechaApertura,
    horaApertura: store.cajaEstado.horaApertura,
    fechaCierre: getTodayISO(),
    horaCierre: getCurrentTimeStr(),
    montoInicial: store.cajaEstado.montoInicial,
    efectivoEsperado: esperado,
    efectivoContado: contado,
    diferencia,
    totalYape: statsTurnoActual.value.yape,
    totalPlin: statsTurnoActual.value.plin,
    totalTransf: statsTurnoActual.value.transf
  }

  historialTurnos.value.unshift(nuevoCierre)
  persistHistorial()

  store.cerrarCaja()
  store.cerrarCorteCajaGlobal()
}

// --- MOVIMIENTOS GENERALES Y ARQUEO GLOBAL ---
const filterType = ref<'todos' | 'ingreso' | 'egreso'>('todos')
const modalOpen = ref(false)
const movTipo = ref<MovimientoTipo>('egreso')
const concepto = ref('')
const monto = ref<number | ''>('')
const metodo = ref('Efectivo')

const statsCaja = computed(() => {
  let totalIngresos = 0
  let totalEgresos = 0
  let efectivoNeto = 0
  let totalYape = 0
  let totalPlin = 0
  let totalTransf = 0

  store.movimientos.forEach(m => {
    if (m.tipo === 'ingreso') {
      totalIngresos += m.monto
      if (m.metodo === 'Efectivo') efectivoNeto += m.monto
      else if (m.metodo === 'Yape') totalYape += m.monto
      else if (m.metodo === 'Plin') totalPlin += m.monto
      else if (m.metodo === 'Transferencia') totalTransf += m.monto
    } else {
      totalEgresos += m.monto
      if (m.metodo === 'Efectivo') efectivoNeto -= m.monto
    }
  })

  return {
    totalIngresos,
    totalEgresos,
    balanceNeto: totalIngresos - totalEgresos,
    efectivoNeto,
    totalYape,
    totalPlin,
    totalTransf
  }
})

// Si es cajero, mostramos solo los movimientos del día actual; si es admin, todos
const filteredMovimientos = computed(() => {
  const today = getTodayISO()
  return store.movimientos.filter(m => {
    const matchType = filterType.value === 'todos' || m.tipo === filterType.value
    if (!isAdmin.value) {
      return matchType && m.fecha === today
    }
    return matchType
  })
})

function openMovModal(tipo: MovimientoTipo) {
  movTipo.value = tipo
  concepto.value = ''
  monto.value = ''
  metodo.value = 'Efectivo'
  modalOpen.value = true
}

function saveMovimiento() {
  if (monto.value === '' || Number(monto.value) <= 0) return

  store.movimientos.unshift({
    id: `mov-${Date.now()}`,
    fecha: getTodayISO(),
    hora: getCurrentTimeStr(),
    tipo: movTipo.value,
    concepto: concepto.value.trim(),
    categoria: movTipo.value === 'ingreso' ? 'Ingreso Extra' : 'Gasto Operativo',
    metodo: metodo.value,
    monto: Number(monto.value)
  })

  store.notify(
    movTipo.value === 'ingreso' ? 'Ingreso registrado en caja' : 'Gasto descontado de caja',
    movTipo.value === 'ingreso' ? 'success' : 'warning'
  )
  modalOpen.value = false
}
</script>

<template>
  <div class="relative min-h-[calc(100vh-130px)] space-y-6">
    <!-- OVERLAY CENTRAL CUANDO LA CAJA ESTÁ CERRADA -->
    <div
      v-if="!store.cajaEstado.abierta"
      class="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs rounded-2xl flex items-center justify-center p-4 animate-fade-in"
    >
      <div class="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 text-center space-y-5">
        <div class="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto text-3xl shadow-xs">
          <i class="ph-bold ph-lock-key"></i>
        </div>

        <div class="space-y-1.5">
          <span class="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
            Caja Cerrada
          </span>
          <h2 class="text-xl font-black text-slate-900">Apertura de Caja Requerida</h2>
          <p class="text-xs text-slate-500 leading-relaxed">
            Para habilitar las operaciones y control de turnos, ingresa el fondo inicial de sencillo en gaveta.
          </p>
        </div>

        <form @submit.prevent="handleAperturaRapida" class="space-y-4 text-left">
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90">
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Fondo Inicial / Sencillo en Gaveta ({{ store.currency }})
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">
                {{ store.currency }}
              </span>
              <input
                v-model.number="montoInicialRapido"
                type="number"
                step="0.50"
                min="0"
                required
                placeholder="0.00"
                class="w-full bg-white text-slate-900 font-mono text-lg font-black pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <i class="ph-bold ph-lock-open text-lg"></i>
            <span>Aperturar Caja del Día</span>
          </button>
        </form>
      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL DE CAJA -->
    <div
      :class="[
        'space-y-6 transition-all duration-200',
        !store.cajaEstado.abierta ? 'pointer-events-none select-none opacity-30' : ''
      ]"
    >
      <!-- Tarjetas de Resumen Financiero (Diferenciadas por Rol) -->
      <div :class="['grid grid-cols-1 gap-4', isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2']">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Ingresos</span>
            <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i class="ph-bold ph-arrow-down-left"></i>
            </span>
          </div>
          <p class="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{{ store.formatMoney(statsCaja.totalIngresos) }}</p>
          <p class="text-xs text-slate-500 mt-1">Membresías + Ventas barra</p>
        </div>

        <!-- Egresos: Solo visible para Admin -->
        <div v-if="isAdmin" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Egresos / Gastos</span>
            <span class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i class="ph-bold ph-arrow-up-right"></i>
            </span>
          </div>
          <p class="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">{{ store.formatMoney(statsCaja.totalEgresos) }}</p>
          <p class="text-xs text-slate-500 mt-1">Servicios, limpieza, insumos</p>
        </div>

        <!-- Balance Neto Acumulado: Solo visible para Admin -->
        <div v-if="isAdmin" class="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Balance Neto Acumulado</span>
            <span class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <i class="ph-bold ph-scales"></i>
            </span>
          </div>
          <p class="text-2xl sm:text-3xl font-extrabold text-white mt-2">{{ store.formatMoney(statsCaja.balanceNeto) }}</p>
          <p class="text-xs text-emerald-400 mt-1">Saldo histórico total</p>
        </div>

        <!-- Si es cajero, mostramos una tarjeta amigable de su turno -->
        <div v-if="!isAdmin" class="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Turno Actual / Caja</span>
            <span class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <i class="ph-bold ph-cash-register"></i>
            </span>
          </div>
          <p class="text-2xl sm:text-3xl font-extrabold text-white mt-2">{{ store.formatMoney(statsTurnoActual?.efectivoEsperado || 0) }}</p>
          <p class="text-xs text-emerald-400 mt-1">Efectivo esperado en gaveta</p>
        </div>
      </div>

      <!-- Desglose por Método de Pago -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Efectivo Físico</span>
            <p class="text-lg font-black text-slate-900 mt-0.5">{{ store.formatMoney(statsCaja.efectivoNeto) }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg">
            <i class="ph-bold ph-money"></i>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Yape</span>
            <p class="text-lg font-black text-purple-600 mt-0.5">{{ store.formatMoney(statsCaja.totalYape) }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
            <i class="ph-bold ph-device-mobile"></i>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Plin</span>
            <p class="text-lg font-black text-cyan-600 mt-0.5">{{ store.formatMoney(statsCaja.totalPlin) }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-lg">
            <i class="ph-bold ph-device-mobile-camera"></i>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transferencias</span>
            <p class="text-lg font-black text-blue-600 mt-0.5">{{ store.formatMoney(statsCaja.totalTransf) }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
            <i class="ph-bold ph-bank"></i>
          </div>
        </div>
      </div>

      <!-- Filtros y Acciones (Botones de gasto solo para Admin) -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <select
            v-model="filterType"
            class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="todos">{{ isAdmin ? 'Todos los movimientos' : 'Movimientos del día' }}</option>
            <option value="ingreso">Solo Ingresos (+)</option>
            <option value="egreso" v-if="isAdmin">Solo Egresos (-)</option>
          </select>
        </div>

        <div v-if="isAdmin" class="flex flex-wrap gap-2">
          <button
            @click="openMovModal('ingreso')"
            class="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <i class="ph-bold ph-plus-circle"></i>
            <span>Ingreso Extra</span>
          </button>
          <button
            @click="openMovModal('egreso')"
            class="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <i class="ph-bold ph-minus-circle"></i>
            <span>Registrar Gasto / Egreso</span>
          </button>
        </div>
      </div>

      <!-- Tabla de Movimientos -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th class="py-3.5 px-4">Fecha / Hora</th>
                <th class="py-3.5 px-4">Concepto / Descripción</th>
                <th class="py-3.5 px-4">Categoría</th>
                <th class="py-3.5 px-4">Método</th>
                <th class="py-3.5 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr v-if="filteredMovimientos.length === 0">
                <td colspan="5" class="py-8 text-center text-slate-400 text-sm">No hay movimientos registrados para este turno.</td>
              </tr>
              <tr v-for="m in filteredMovimientos" :key="m.id" class="hover:bg-slate-50/80 transition">
                <td class="py-3.5 px-4 text-xs text-slate-500 font-mono">
                  {{ formatDateHuman(m.fecha) }} <span class="text-slate-400">{{ m.hora }}</span>
                </td>
                <td class="py-3.5 px-4 font-semibold text-slate-800">{{ m.concepto }}</td>
                <td class="py-3.5 px-4">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{{ m.categoria }}</span>
                </td>
                <td class="py-3.5 px-4 text-xs text-slate-600">{{ m.metodo }}</td>
                <td :class="['py-3.5 px-4 text-right font-extrabold', m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600']">
                  {{ m.tipo === 'ingreso' ? '+' : '-' }} {{ store.formatMoney(m.monto) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Historial de Cortes / Cierres de Caja (Solo visible para Admin) -->
      <div v-if="isAdmin && historialTurnos.length > 0" class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-900 text-sm">Historial de Cortes y Cierres de Caja</h3>
            <p class="text-xs text-slate-500">Registro de cierres realizados</p>
          </div>
          <span class="text-xs font-bold text-slate-500">{{ historialTurnos.length }} cierre(s)</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th class="py-3 px-4">Apertura / Cierre</th>
                <th class="py-3 px-4 text-right">Base Inicial</th>
                <th class="py-3 px-4 text-right">Efec. Esperado</th>
                <th class="py-3 px-4 text-right">Efec. Contado</th>
                <th class="py-3 px-4 text-right">Diferencia</th>
                <th class="py-3 px-4 text-right">Digital (Yape/Plin/Transf)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              <tr v-for="t in historialTurnos" :key="t.id" class="hover:bg-slate-50/80">
                <td class="py-3 px-4 font-mono text-slate-600">
                  <div>Inició: {{ t.fechaApertura }} {{ t.horaApertura }}</div>
                  <div class="text-slate-400">Cerró: {{ t.fechaCierre }} {{ t.horaCierre }}</div>
                </td>
                <td class="py-3 px-4 text-right font-semibold">{{ store.formatMoney(t.montoInicial) }}</td>
                <td class="py-3 px-4 text-right font-semibold">{{ store.formatMoney(t.efectivoEsperado) }}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-900">{{ store.formatMoney(t.efectivoContado) }}</td>
                <td class="py-3 px-4 text-right font-bold">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md',
                      t.diferencia === 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : t.diferencia > 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-rose-100 text-rose-700'
                    ]"
                  >
                    {{ t.diferencia >= 0 ? '+' : '' }}{{ store.formatMoney(t.diferencia) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right text-slate-600 font-medium">
                  Y: {{ store.formatMoney(t.totalYape) }} &bull; P: {{ store.formatMoney(t.totalPlin) }} &bull; T: {{ store.formatMoney(t.totalTransf) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Cierre / Corte de Caja (Sincronizado con el Store Global) -->
    <BaseModal v-model="store.cierreModalGlobalOpen" title="Corte y Cierre de Caja" max-width-class="max-w-md">
      <form v-if="statsTurnoActual" @submit.prevent="confirmarCierre" class="p-6 space-y-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">Fondo Inicial de Apertura:</span>
            <span class="font-bold text-slate-800">{{ store.formatMoney(statsTurnoActual.montoInicial) }}</span>
          </div>
          <div class="flex justify-between text-emerald-700">
            <span>(+) Ventas / Ingresos en Efectivo:</span>
            <span class="font-bold">+ {{ store.formatMoney(statsTurnoActual.ingresosEfectivo) }}</span>
          </div>
          <div class="flex justify-between text-rose-600">
            <span>(-) Gastos / Salidas en Efectivo:</span>
            <span class="font-bold">- {{ store.formatMoney(statsTurnoActual.egresosEfectivo) }}</span>
          </div>
          <div class="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
            <span>Efectivo Esperado en Gaveta:</span>
            <span>{{ store.formatMoney(statsTurnoActual.efectivoEsperado) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div class="p-2 rounded-lg bg-purple-50 text-purple-800 font-bold">
            Yape: {{ store.formatMoney(statsTurnoActual.yape) }}
          </div>
          <div class="p-2 rounded-lg bg-cyan-50 text-cyan-800 font-bold">
            Plin: {{ store.formatMoney(statsTurnoActual.plin) }}
          </div>
          <div class="p-2 rounded-lg bg-blue-50 text-blue-800 font-bold">
            Transf: {{ store.formatMoney(statsTurnoActual.transf) }}
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">¿Cuánto efectivo contaste físicamente? *</label>
          <input
            v-model.number="efectivoContadoInput"
            type="number"
            step="0.01"
            min="0"
            required
            class="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:border-emerald-500"
          />
          <p class="text-[11px] text-slate-500 mt-1">
            Diferencia calculada:
            <strong :class="(efectivoContadoInput - statsTurnoActual.efectivoEsperado) < 0 ? 'text-rose-600' : 'text-emerald-600'">
              {{ store.formatMoney(efectivoContadoInput - statsTurnoActual.efectivoEsperado) }}
            </strong>
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="store.cerrarCorteCajaGlobal()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
            Cancelar
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer">
            Confirmar Cierre y Bloquear Caja
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Modal Movimiento Extra (Solo Admin) -->
    <BaseModal v-if="isAdmin" v-model="modalOpen" :title="movTipo === 'ingreso' ? 'Registrar Ingreso Extra' : 'Registrar Gasto / Egreso'" max-width-class="max-w-md">
      <form @submit.prevent="saveMovimiento" class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Concepto / Descripción *</label>
          <input
            v-model="concepto"
            type="text"
            required
            placeholder="Ej. Compra de artículos de limpieza"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Monto *</label>
            <input
              v-model.number="monto"
              type="number"
              step="0.01"
              min="0.1"
              required
              placeholder="0.00"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Método</label>
            <select v-model="metodo" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium">
              <option value="Efectivo">Efectivo</option>
              <option value="Yape">Yape</option>
              <option value="Plin">Plin</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            @click="modalOpen = false"
            class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :class="[
              'px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer',
              movTipo === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            ]"
          >
            Registrar
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
