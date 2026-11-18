<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGymStore } from '@/stores/useGymStore'

const store = useGymStore()
const selectedProductFilter = ref('todos')

const movimientosKardex = computed(() => {
  const registros: Array<{
    id: string
    fecha: string
    hora: string
    producto: string
    tipoMovimiento: 'SALIDA (VENTA)' | 'ENTRADA (ANULACIÓN)'
    cantidad: number
    referencia: string
  }> = []

  store.movimientos
    .filter(m => m.categoria === 'Barra / Tienda')
    .forEach(m => {
      const esAnulacion = m.tipo === 'egreso' && m.concepto.includes('[ANULACIÓN')
      const cleanConcepto = m.concepto
        .replace(/^\[ANULACIÓN [^\]]+\]\s*Extorno de\s*/i, '')
        .replace(/^Venta Barra( POS)?:\s*/i, '')

      cleanConcepto.split(',').forEach((part, idx) => {
        const trimmed = part.trim()
        const match = trimmed.match(/^(\d+)x\s+(.+)$/i)

        let cantidad = 1
        let producto = trimmed

        if (match && match[1] && match[2]) {
          cantidad = Number(match[1])
          producto = match[2].trim()
        }

        registros.push({
          id: `${m.id}-${idx}`,
          fecha: m.fecha,
          hora: m.hora,
          producto,
          tipoMovimiento: esAnulacion ? 'ENTRADA (ANULACIÓN)' : 'SALIDA (VENTA)',
          cantidad,
          referencia: `#${m.id.slice(-6).toUpperCase()}`
        })
      })
    })

  if (selectedProductFilter.value === 'todos') return registros
  return registros.filter(
    r => r.producto.toLowerCase() === selectedProductFilter.value.toLowerCase()
  )
})
</script>

<template>
  <div class="space-y-6">
    <!-- Filtro por Producto -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Filtrar por producto:</label>
        <select
          v-model="selectedProductFilter"
          class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="todos">Todos los productos</option>
          <option v-for="p in store.productos" :key="p.id" :value="p.nombre">
            {{ p.nombre }} (Stock actual: {{ p.stock }})
          </option>
        </select>
      </div>

      <span class="text-xs text-slate-500">
        Movimientos físicos: <strong class="text-slate-900">{{ movimientosKardex.length }}</strong>
      </span>
    </div>

    <!-- Tabla de Kardex por Producto -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th class="py-3 px-4">Fecha / Hora</th>
              <th class="py-3 px-4">Producto</th>
              <th class="py-3 px-4">Tipo Movimiento</th>
              <th class="py-3 px-4 text-center">Cantidad</th>
              <th class="py-3 px-4 text-right">Doc. Referencia</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="movimientosKardex.length === 0">
              <td colspan="5" class="py-12 text-center text-slate-400 text-sm">
                No hay movimientos físicos de inventario para mostrar.
              </td>
            </tr>

            <tr v-for="reg in movimientosKardex" :key="reg.id" class="hover:bg-slate-50/70 transition">
              <td class="py-3.5 px-4 font-mono text-xs text-slate-600">
                {{ reg.fecha }} <span class="text-slate-400 ml-1">{{ reg.hora }}</span>
              </td>
              <td class="py-3.5 px-4 font-bold text-slate-800">
                {{ reg.producto }}
              </td>
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md',
                    reg.tipoMovimiento.startsWith('ENTRADA')
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  ]"
                >
                  {{ reg.tipoMovimiento }}
                </span>
              </td>
              <td
                :class="[
                  'py-3.5 px-4 text-center font-mono font-bold',
                  reg.tipoMovimiento.startsWith('ENTRADA') ? 'text-emerald-600' : 'text-rose-600'
                ]"
              >
                {{ reg.tipoMovimiento.startsWith('ENTRADA') ? '+' : '-' }}{{ reg.cantidad }}
              </td>
              <td class="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                {{ reg.referencia }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
