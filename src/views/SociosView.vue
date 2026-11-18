<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { formatDateHuman } from '@/utils/dateUtils'
import type { SocioStatusCode } from '@/types/gym.types'

const store = useGymStore()
const search = ref('')
const currentFilter = ref<'todos' | SocioStatusCode>('todos')

const filteredSocios = computed(() => {
  const q = search.value.toLowerCase().trim()
  return store.sociosConEstado.filter(s => {
    const matchesSearch =
      s.nombre.toLowerCase().includes(q) ||
      s.dni.toLowerCase().includes(q) ||
      (s.telefono && s.telefono.includes(q))
    const matchesFilter = currentFilter.value === 'todos' || s.status.code === currentFilter.value
    return matchesSearch && matchesFilter
  })
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Barra de Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 justify-between">
      <div class="relative flex-1 max-w-md">
        <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, DNI o teléfono..."
          class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="currentFilter = 'todos'"
          :class="[
            'px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer',
            currentFilter === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          ]"
        >
          Todos
        </button>
        <button
          @click="currentFilter = 'activo'"
          :class="[
            'px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer',
            currentFilter === 'activo' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          ]"
        >
          Activos
        </button>
        <button
          @click="currentFilter = 'por_vencer'"
          :class="[
            'px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer',
            currentFilter === 'por_vencer' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          ]"
        >
          Por Vencer
        </button>
        <button
          @click="currentFilter = 'vencido'"
          :class="[
            'px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer',
            currentFilter === 'vencido' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          ]"
        >
          Vencidos
        </button>
      </div>
    </div>

    <!-- Tabla de Socios -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th class="py-3.5 px-4">Socio / DNI</th>
              <th class="py-3.5 px-4">Teléfono</th>
              <th class="py-3.5 px-4">Plan Actual</th>
              <th class="py-3.5 px-4">Vigencia</th>
              <th class="py-3.5 px-4">Estado</th>
              <th class="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="filteredSocios.length === 0">
              <td colspan="6" class="py-10 text-center text-slate-400 text-sm">
                No se encontraron socios con los criterios seleccionados.
              </td>
            </tr>
            <tr v-for="s in filteredSocios" :key="s.id" class="hover:bg-slate-50/80 transition">
              <td class="py-3.5 px-4">
                <p class="font-bold text-slate-900">{{ s.nombre }}</p>
                <p class="text-xs text-slate-500">DNI: {{ s.dni }}</p>
              </td>
              <td class="py-3.5 px-4 text-xs text-slate-600 font-medium">
                <span v-if="s.telefono" class="inline-flex items-center gap-1">
                  <i class="ph ph-whatsapp-logo text-emerald-600 text-base"></i>
                  {{ s.telefono }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="text-xs font-semibold text-slate-800">{{ s.plan.nombre }}</span>
              </td>
              <td class="py-3.5 px-4 text-xs text-slate-600">
                <div>Inicio: <span class="font-medium">{{ formatDateHuman(s.inicio) }}</span></div>
                <div>Fin: <span class="font-bold text-slate-800">{{ formatDateHuman(s.fin) }}</span></div>
              </td>
              <td class="py-3.5 px-4">
                <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border', s.status.badgeClass]">
                  {{ s.status.label }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <button
                    @click="store.renovarModalState = { open: true, socioId: s.id }"
                    title="Renovar Membresía"
                    class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Renovar
                  </button>
                  <button
                    @click="store.socioModalState = { open: true, socioId: s.id }"
                    title="Editar datos"
                    class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  >
                    <i class="ph-bold ph-pencil-simple text-sm"></i>
                  </button>
                  <button
                    @click="store.deleteSocio(s.id)"
                    title="Eliminar socio"
                    class="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    <i class="ph-bold ph-trash text-sm"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
