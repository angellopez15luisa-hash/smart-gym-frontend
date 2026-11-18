<script setup lang="ts">
import { ref } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import BaseModal from '@/components/common/BaseModal.vue'
import type { Plan } from '@/types/gym.types'

const store = useGymStore()

const modalOpen = ref(false)
const planId = ref<string | null>(null)
const nombre = ref('')
const dias = ref<number | ''>(30)
const precio = ref<number | ''>('')
const desc = ref('')

function openModal(plan?: Plan) {
  if (plan) {
    planId.value = plan.id
    nombre.value = plan.nombre
    dias.value = plan.dias
    precio.value = plan.precio
    desc.value = plan.desc || ''
  } else {
    planId.value = null
    nombre.value = ''
    dias.value = 30
    precio.value = ''
    desc.value = ''
  }
  modalOpen.value = true
}

function handleSavePlan() {
  if (precio.value === '' || dias.value === '') return

  store.savePlan({
    id: planId.value || undefined,
    nombre: nombre.value.trim(),
    dias: Number(dias.value),
    precio: Number(precio.value),
    desc: desc.value.trim()
  })

  modalOpen.value = false
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Cabecera de la sección -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
      <div>
        <h3 class="font-bold text-slate-900">Catálogo de Membresías</h3>
        <p class="text-xs text-slate-500">Configura los planes disponibles para inscribir o renovar socios</p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
      >
        <i class="ph-bold ph-plus"></i>
        <span>Crear Nuevo Plan</span>
      </button>
    </div>

    <!-- Grid de Planes -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="p in store.planes"
        :key="p.id"
        class="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-emerald-400 transition"
      >
        <div>
          <div class="flex items-start justify-between gap-2">
            <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
              {{ p.dias }} {{ p.dias === 1 ? 'Día' : 'Días' }}
            </span>
            <div class="flex gap-1">
              <button
                @click="openModal(p)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Editar plan"
              >
                <i class="ph-bold ph-pencil-simple text-sm"></i>
              </button>
              <button
                @click="store.deletePlan(p.id)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Eliminar plan"
              >
                <i class="ph-bold ph-trash text-sm"></i>
              </button>
            </div>
          </div>

          <h4 class="text-lg font-extrabold text-slate-900 mt-3">{{ p.nombre }}</h4>
          <p class="text-xs text-slate-500 mt-1">{{ p.desc || 'Acceso completo a instalaciones' }}</p>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-slate-900">{{ store.formatMoney(p.precio) }}</span>
          <span class="text-xs text-slate-400 font-medium">Pago único</span>
        </div>
      </div>
    </div>

    <!-- Modal Crear/Editar Plan -->
    <BaseModal v-model="modalOpen" :title="planId ? 'Editar Plan' : 'Crear Nuevo Plan'" max-width-class="max-w-md">
      <form @submit.prevent="handleSavePlan" class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre del Plan *</label>
          <input
            v-model="nombre"
            type="text"
            required
            placeholder="Ej. Mensualidad General"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Duración (Días) *</label>
            <input
              v-model.number="dias"
              type="number"
              min="1"
              required
              placeholder="30"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Precio *</label>
            <input
              v-model.number="precio"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="80.00"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Descripción corta</label>
          <input
            v-model="desc"
            type="text"
            placeholder="Ej. Acceso libre a máquinas y pesas"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
          />
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
            class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
          >
            Guardar Plan
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
