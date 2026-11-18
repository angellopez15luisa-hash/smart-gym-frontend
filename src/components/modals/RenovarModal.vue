<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { getTodayISO, addDaysToDateISO, formatDateHuman } from '@/utils/dateUtils'
import BaseModal from '@/components/common/BaseModal.vue'

const store = useGymStore()

const planId = ref('')
const metodoPago = ref('Efectivo')

const socioActual = computed(() => {
  const id = store.renovarModalState.socioId
  if (!id) return null
  return store.socios.find(s => s.id === id) || null
})

watch(
  () => store.renovarModalState,
  state => {
    if (state.open && store.planes.length > 0) {
      planId.value = store.planes[0]?.id || ''
      metodoPago.value = 'Efectivo'
    }
  },
  { deep: true }
)

function handleRenovar() {
  if (!store.cajaEstado.abierta) {
    store.notify('¡Caja Cerrada! Debes aperturar caja para procesar renovaciones.', 'error')
    return
  }

  const socio = socioActual.value
  if (!socio || !planId.value) return

  const selectedPlan = store.planes.find(p => p.id === planId.value)
  const diasPlan = selectedPlan ? selectedPlan.dias : 30
  const precioPlan = selectedPlan ? selectedPlan.precio : 0

  const hoy = getTodayISO()
  const baseDate = socio.fin > hoy ? socio.fin : hoy
  const nuevaFechaFin = addDaysToDateISO(baseDate, diasPlan)

  const idx = store.socios.findIndex(s => s.id === socio.id)
  if (idx !== -1) {
    store.socios[idx] = {
      ...socio,
      planId: planId.value,
      inicio: hoy,
      fin: nuevaFechaFin
    }
  }

  store.movimientos.unshift({
    id: `mov-${Date.now()}`,
    fecha: hoy,
    hora: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    tipo: 'ingreso',
    concepto: `Renovación (${selectedPlan?.nombre || 'Plan'}) - ${socio.nombre}`,
    categoria: 'Membresía',
    metodo: metodoPago.value,
    monto: precioPlan
  })

  store.notify(`Membresía renovada con éxito para ${socio.nombre} (+${store.formatMoney(precioPlan)})`)
  store.renovarModalState.open = false
}
</script>

<template>
  <BaseModal v-model="store.renovarModalState.open" title="Renovar Membresía de Socio" max-width-class="max-w-md" header-class="bg-amber-50">
    <div v-if="socioActual" class="p-6 space-y-4">
      <!-- ADVERTENCIA SI LA CAJA ESTÁ CERRADA -->
      <div v-if="!store.cajaEstado.abierta" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
        <i class="ph-bold ph-lock text-base shrink-0"></i>
        <span>Atención: La caja está cerrada. No podrás confirmar la renovación hasta aperturar caja.</span>
      </div>

      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
        <span class="text-xs font-bold text-slate-400 uppercase">Socio Seleccionado</span>
        <h4 class="font-extrabold text-slate-900 text-lg">{{ socioActual.nombre }}</h4>
        <p class="text-xs text-slate-600">DNI: {{ socioActual.dni }} &bull; Vence actualmente: <strong class="text-slate-900">{{ formatDateHuman(socioActual.fin) }}</strong></p>
      </div>

      <form @submit.prevent="handleRenovar" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Seleccionar Nuevo Plan *</label>
          <select
            v-model="planId"
            required
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option v-for="p in store.planes" :key="p.id" :value="p.id">
              {{ p.nombre }} ({{ p.dias }} días) - {{ store.formatMoney(p.precio) }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Método de Pago</label>
          <select
            v-model="metodoPago"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Yape">Yape</option>
            <option value="Plin">Plin</option>
            <option value="Transferencia">Transferencia Bancaria</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            @click="store.renovarModalState.open = false"
            class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="!store.cajaEstado.abierta"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar Renovación
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
