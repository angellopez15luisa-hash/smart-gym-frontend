<script setup lang="ts">
import { ref } from 'vue'
import Swal from 'sweetalert2'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { PlanAction } from '@/business/actions/plan.action'
import type { Plan } from '@/types'
import PlanFormModal from '@/components/plans/PlanFormModal.vue'

const queryClient = useQueryClient()

const {
  data: planes,
  isLoading,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: ['plans'],
  queryFn: () => PlanAction.findAll(),
})

const modalOpen = ref(false)
const selectedPlan = ref<Plan | null>(null)

const deleteMutation = useMutation({
  mutationFn: (id: Plan['id']) => PlanAction.remove(id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['plans'] })
    await Swal.fire({
      icon: 'success',
      title: 'Plan eliminado',
      text: 'El plan se eliminó correctamente.',
      timer: 1600,
      showConfirmButton: false,
    })
  },
  onError: async (err: Error) => {
    await Swal.fire({
      icon: 'error',
      title: 'No se pudo eliminar',
      text: err?.message || 'Ocurrió un error al eliminar el plan.',
      confirmButtonColor: '#0f172a',
    })
  },
})

function formatMoney(amount: number | string) {
  const numeric = Number(amount)
  if (Number.isNaN(numeric)) return 'S/ 0.00'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(numeric)
}

function openModal(plan?: Plan) {
  selectedPlan.value = plan ?? null
  modalOpen.value = true
}

function handleSaved() {
  selectedPlan.value = null
}

async function handleDeletePlan(plan: Plan) {
  if (deleteMutation.isPending.value) return

  const result = await Swal.fire({
    title: '¿Eliminar plan?',
    html: `Se eliminará <strong>${plan.name}</strong> y no podrás deshacer esta acción.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
  })

  if (result.isConfirmed) {
    deleteMutation.mutate(plan.id)
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Cabecera de la sección -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs"
    >
      <div>
        <h3 class="font-bold text-slate-900">Catálogo de Membresías</h3>
        <p class="text-xs text-slate-500">
          Configura los planes disponibles para inscribir o renovar socios
        </p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
      >
        <i class="ph-bold ph-plus"></i>
        <span>Crear Nuevo Plan</span>
      </button>
    </div>

    <!-- Estado de carga -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 animate-pulse"
      >
        <div class="h-5 w-20 bg-slate-200 rounded-lg"></div>
        <div class="h-6 w-2/3 bg-slate-200 rounded-lg"></div>
        <div class="h-4 w-full bg-slate-100 rounded-lg"></div>
        <div class="h-8 w-28 bg-slate-200 rounded-lg mt-6"></div>
      </div>
    </div>

    <!-- Estado de error -->
    <div
      v-else-if="isError"
      class="bg-white p-6 rounded-2xl border border-rose-200 text-center space-y-3"
    >
      <p class="text-sm font-semibold text-rose-600">
        {{ (error as Error)?.message || 'No se pudieron cargar los planes.' }}
      </p>
      <button
        @click="refetch()"
        class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
      >
        Reintentar
      </button>
    </div>

    <!-- Grid de Planes -->
    <div
      v-else-if="planes && planes.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      <div
        v-for="p in planes"
        :key="p.id"
        class="bg-white p-6 rounded-2xl border shadow-2xs flex flex-col justify-between transition"
        :class="
          p.isActive
            ? 'border-slate-200 hover:border-emerald-400'
            : 'border-slate-200/80 bg-slate-50/60 opacity-75 hover:border-slate-300'
        "
      >
        <div>
          <div class="flex items-center justify-between gap-2">
            <span
              class="px-2.5 py-1 rounded-lg text-xs font-bold"
              :class="
                p.isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-200/80 text-slate-600'
              "
            >
              {{ p.durationDays }} {{ p.durationDays === 1 ? 'Día' : 'Días' }}
            </span>

            <div class="flex items-center gap-1.5">
              <span
                class="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                :class="
                  p.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-600'
                "
              >
                {{ p.isActive ? 'Activo' : 'Inactivo' }}
              </span>

              <button
                @click="openModal(p)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Editar plan"
              >
                <i class="ph-bold ph-pencil-simple text-sm"></i>
              </button>
              <button
                type="button"
                :disabled="deleteMutation.isPending.value"
                @click="handleDeletePlan(p)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition cursor-pointer"
                title="Eliminar plan"
              >
                <i class="ph-bold ph-trash text-sm"></i>
              </button>
            </div>
          </div>

          <h4 class="text-lg font-extrabold text-slate-900 mt-3">{{ p.name }}</h4>
          <p class="text-xs text-slate-500 mt-1">
            {{ p.description || 'Acceso completo a instalaciones' }}
          </p>
        </div>

        <div
          class="mt-6 pt-4 border-t border-slate-100 flex items-baseline justify-between"
        >
          <span class="text-2xl font-extrabold text-slate-900">
            {{ formatMoney(p.price) }}
          </span>
          <span class="text-xs text-slate-400 font-medium">Pago único</span>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div
      v-else
      class="bg-white p-10 rounded-2xl border border-slate-200 text-center"
    >
      <p class="text-sm font-semibold text-slate-700">
        Aún no hay planes registrados
      </p>
      <p class="text-xs text-slate-500 mt-1">
        Crea tu primer plan usando el botón superior para empezar a inscribir socios.
      </p>
    </div>

    <!-- Modal Crear / Editar Plan -->
    <PlanFormModal
      v-model="modalOpen"
      :plan="selectedPlan"
      @saved="handleSaved"
    />
  </div>
</template>
 
