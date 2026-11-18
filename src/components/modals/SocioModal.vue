<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { getTodayISO, addDaysToDateISO } from '@/utils/dateUtils'
import BaseModal from '@/components/common/BaseModal.vue'

const store = useGymStore()

const nombre = ref('')
const dni = ref('')
const telefono = ref('')
const planId = ref('')
const metodoPago = ref('Efectivo')

watch(
  () => store.socioModalState,
  state => {
    if (state.open) {
      if (state.socioId) {
        const socio = store.socios.find(s => s.id === state.socioId)
        if (socio) {
          nombre.value = socio.nombre
          dni.value = socio.dni
          telefono.value = socio.telefono || ''
          planId.value = socio.planId
          metodoPago.value = 'Efectivo'
        }
      } else {
        nombre.value = ''
        dni.value = ''
        telefono.value = ''
        planId.value = store.planes[0]?.id || ''
        metodoPago.value = 'Efectivo'
      }
    }
  },
  { deep: true }
)

function handleSubmit() {
  const state = store.socioModalState

  // Si es un socio NUEVO con cobro, validamos que la caja esté abierta
  if (!state.socioId && !store.cajaEstado.abierta) {
    store.notify('¡Caja Cerrada! Debes aperturar caja para registrar inscripciones con cobro.', 'error')
    return
  }

  if (!nombre.value.trim() || !dni.value.trim() || !planId.value) return

  const selectedPlan = store.planes.find(p => p.id === planId.value)
  const diasPlan = selectedPlan ? selectedPlan.dias : 30
  const precioPlan = selectedPlan ? selectedPlan.precio : 0

  if (state.socioId) {
    const idx = store.socios.findIndex(s => s.id === state.socioId)
    if (idx !== -1) {
      const socioActual = store.socios[idx]!
      store.socios[idx] = {
        id: socioActual.id,
        dni: dni.value.trim(),
        nombre: nombre.value.trim(),
        telefono: telefono.value.trim(),
        planId: planId.value,
        inicio: socioActual.inicio,
        fin: socioActual.fin
      }
      store.notify('Datos del socio actualizados')
    }
  } else {
    const hoy = getTodayISO()
    const fin = addDaysToDateISO(hoy, diasPlan)
    const newId = `socio-${Date.now()}`

    store.socios.push({
      id: newId,
      dni: dni.value.trim(),
      nombre: nombre.value.trim(),
      telefono: telefono.value.trim(),
      planId: planId.value,
      inicio: hoy,
      fin: fin
    })

    store.movimientos.unshift({
      id: `mov-${Date.now()}`,
      fecha: hoy,
      hora: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      tipo: 'ingreso',
      concepto: `Inscripción Plan: ${selectedPlan?.nombre || 'General'} - ${nombre.value.trim()}`,
      categoria: 'Membresía',
      metodo: metodoPago.value,
      monto: precioPlan
    })

    store.notify(`Socio registrado con éxito (+${store.formatMoney(precioPlan)})`)
  }

  store.socioModalState.open = false
}
</script>

<template>
  <BaseModal
    v-model="store.socioModalState.open"
    :title="store.socioModalState.socioId ? 'Editar Datos del Socio' : 'Inscribir Nuevo Socio'"
    max-width-class="max-w-md"
  >
    <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
      <!-- ADVERTENCIA SI LA CAJA ESTÁ CERRADA AL CREAR NUEVO SOCIO -->
      <div v-if="!store.socioModalState.socioId && !store.cajaEstado.abierta" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
        <i class="ph-bold ph-lock text-base shrink-0"></i>
        <span>Atención: La caja está cerrada. No podrás registrar la inscripción hasta aperturar caja.</span>
      </div>

      <div>
        <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre Completo *</label>
        <input
          v-model="nombre"
          type="text"
          required
          placeholder="Ej. Juan Pérez"
          class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">DNI / Código *</label>
          <input
            v-model="dni"
            type="text"
            required
            placeholder="74859612"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">WhatsApp / Teléfono</label>
          <input
            v-model="telefono"
            type="text"
            placeholder="987654321"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Seleccionar Plan *</label>
        <select
          v-model="planId"
          required
          class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option v-for="p in store.planes" :key="p.id" :value="p.id">
            {{ p.nombre }} ({{ p.dias }} days) - {{ store.formatMoney(p.precio) }}
          </option>
        </select>
      </div>

      <div v-if="!store.socioModalState.socioId">
        <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Método de Pago (Caja)</label>
        <select
          v-model="metodoPago"
          class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
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
          @click="store.socioModalState.open = false"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="!store.socioModalState.socioId && !store.cajaEstado.abierta"
          class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ store.socioModalState.socioId ? 'Guardar Cambios' : 'Registrar Socio' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
