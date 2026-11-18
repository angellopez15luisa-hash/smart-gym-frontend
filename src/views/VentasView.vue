<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { getTodayISO, getCurrentTimeStr } from '@/utils/dateUtils'
import type { Movimiento } from '@/types/gym.types'

const store = useGymStore()

const searchQuery = ref('')
const selectedTicket = ref<Movimiento | null>(null)

// Filtramos los ingresos de Barra / Tienda (tickets emitidos)
const ticketsVenta = computed(() => {
  return store.movimientos
    .filter(m => m.categoria === 'Barra / Tienda' && m.tipo === 'ingreso')
    .filter(m => {
      if (!searchQuery.value.trim()) return true
      const q = searchQuery.value.toLowerCase()
      return (
        m.concepto.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.metodo.toLowerCase().includes(q)
      )
    })
})

// Verificar si un ticket ya fue anulado buscando un movimiento de anulación asociado
function isAnulado(ticketId: string): boolean {
  return store.movimientos.some(m => m.concepto.includes(`[ANULACIÓN ${ticketId}]`))
}

function parseItemsFromConcepto(concepto: string) {
  const clean = concepto.replace(/^Venta Barra( POS)?:\s*/i, '')
  return clean.split(',').map(part => {
    const trimmed = part.trim()
    const match = trimmed.match(/^(\d+)x\s+(.+)$/i)
    if (match && match[1] && match[2]) {
      return { cantidad: Number(match[1]), nombre: match[2].trim() }
    }
    return { cantidad: 1, nombre: trimmed }
  })
}

function anularVenta(ticket: Movimiento) {
  if (isAnulado(ticket.id)) return

  const confirmar = confirm(
    `¿Seguro que deseas ANULAR este ticket por ${store.formatMoney(ticket.monto)}?\n\nSe devolverá el stock al inventario y se registrará el extorno en caja.`
  )
  if (!confirmar) return

  // 1. Devolver stock a cada producto involucrado en el ticket
  const items = parseItemsFromConcepto(ticket.concepto)
  items.forEach(item => {
    const prod = store.productos.find(
      p => p.nombre.toLowerCase() === item.nombre.toLowerCase()
    )
    if (prod) {
      prod.stock += item.cantidad
    }
  })

  // 2. Registrar movimiento de egreso/extorno en caja para auditar la anulación sin borrar huella
  store.movimientos.unshift({
    id: `mov-${Date.now()}`,
    fecha: getTodayISO(),
    hora: getCurrentTimeStr(),
    tipo: 'egreso',
    concepto: `[ANULACIÓN ${ticket.id}] Extorno de ${ticket.concepto}`,
    categoria: 'Barra / Tienda',
    metodo: ticket.metodo,
    monto: ticket.monto
  })

  selectedTicket.value = null
  store.notify('Venta anulada y stock repuesto al inventario', 'warning')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Barra de Búsqueda -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="relative w-full sm:w-96">
        <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por producto, método de pago o ID..."
          class="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-500 text-sm"
        />
      </div>

      <div class="text-xs font-semibold text-slate-500">
        Total tickets registrados: <span class="text-slate-900 font-bold">{{ ticketsVenta.length }}</span>
      </div>
    </div>

    <!-- Tabla de Tickets / Cabecera de Ventas -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th class="py-3 px-4">Ticket / Fecha</th>
              <th class="py-3 px-4">Productos Vendidos</th>
              <th class="py-3 px-4">Método Pago</th>
              <th class="py-3 px-4 text-center">Estado</th>
              <th class="py-3 px-4 text-right">Total</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="ticketsVenta.length === 0">
              <td colspan="6" class="py-12 text-center text-slate-400 text-sm">
                No hay ventas registradas en el mostrador todavía.
              </td>
            </tr>

            <tr
              v-for="ticket in ticketsVenta"
              :key="ticket.id"
              :class="['transition', isAnulado(ticket.id) ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50/70']"
            >
              <td class="py-3.5 px-4">
                <p class="font-mono text-xs font-bold text-slate-700">#{{ ticket.id.slice(-6).toUpperCase() }}</p>
                <p class="text-[11px] text-slate-400">{{ ticket.fecha }} &bull; {{ ticket.hora }}</p>
              </td>

              <td class="py-3.5 px-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="(item, idx) in parseItemsFromConcepto(ticket.concepto)"
                    :key="idx"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                  >
                    <strong class="text-slate-900">{{ item.cantidad }}x</strong> {{ item.nombre }}
                  </span>
                </div>
              </td>

              <td class="py-3.5 px-4">
                <span class="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {{ ticket.metodo }}
                </span>
              </td>

              <td class="py-3.5 px-4 text-center">
                <span
                  v-if="isAnulado(ticket.id)"
                  class="inline-block text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-700"
                >
                  Anulado
                </span>
                <span
                  v-else
                  class="inline-block text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700"
                >
                  Cobrado
                </span>
              </td>

              <td
                :class="[
                  'py-3.5 px-4 text-right font-mono font-bold',
                  isAnulado(ticket.id) ? 'line-through text-slate-400' : 'text-slate-900'
                ]"
              >
                {{ store.formatMoney(ticket.monto) }}
              </td>

              <td class="py-3.5 px-4 text-right space-x-1.5">
                <button
                  @click="selectedTicket = ticket"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  title="Ver Detalle"
                >
                  <i class="ph-bold ph-eye"></i>
                </button>
                <button
                  v-if="!isAnulado(ticket.id)"
                  @click="anularVenta(ticket)"
                  class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer"
                  title="Anular Venta y Reponer Stock"
                >
                  Anular
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Detalle del Ticket -->
    <div v-if="selectedTicket" class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-extrabold text-slate-900 text-base">
              Detalle Ticket #{{ selectedTicket.id.slice(-6).toUpperCase() }}
            </h3>
            <p class="text-xs text-slate-400">{{ selectedTicket.fecha }} a las {{ selectedTicket.hora }}</p>
          </div>
          <button @click="selectedTicket = null" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Artículos incluidos</p>
          <div class="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
            <div
              v-for="(item, idx) in parseItemsFromConcepto(selectedTicket.concepto)"
              :key="idx"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-slate-700 font-medium">{{ item.nombre }}</span>
              <span class="font-mono font-bold text-slate-900">{{ item.cantidad }} unid.</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-sm">
          <span class="text-slate-500">Método de pago: <strong class="text-slate-800">{{ selectedTicket.metodo }}</strong></span>
          <span class="font-mono text-lg font-black text-emerald-600">{{ store.formatMoney(selectedTicket.monto) }}</span>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <button
            v-if="!isAnulado(selectedTicket.id)"
            @click="anularVenta(selectedTicket)"
            class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Anular Ticket y Reponer Stock
          </button>
          <button
            @click="selectedTicket = null"
            class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
