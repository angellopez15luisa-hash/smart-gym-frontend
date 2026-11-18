<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { formatDateHuman } from '@/utils/dateUtils'
import type { Socio, SocioStatus, Plan } from '@/types/gym.types'

const store = useGymStore()
const query = ref('')
const lastCheckInResult = ref<{ socio: Socio; status: SocioStatus; plan: Plan; hora: string } | null>(null)

const suggestions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return store.sociosConEstado.filter(
    s => s.nombre.toLowerCase().includes(q) || s.dni.toLowerCase().includes(q)
  )
})

function executeCheckIn(socioId: string) {
  const res = store.registrarAsistencia(socioId)
  if (res) {
    lastCheckInResult.value = res
    query.value = ''
  }
}

function handleFormSubmit() {
  const q = query.value.trim().toLowerCase()
  if (!q) return
  const match =
    store.socios.find(s => s.dni.toLowerCase() === q) ||
    store.socios.find(s => s.nombre.toLowerCase().includes(q))

  if (!match) {
    store.notify('No se encontró ningún socio con ese DNI o nombre', 'error')
    return
  }
  executeCheckIn(match.id)
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
    <!-- Terminal de Check-In (7 columnas) -->
    <div class="lg:col-span-7 space-y-6">
      <div class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center">
            <i class="ph-bold ph-identification-card text-2xl"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Terminal de Acceso / Check-In</h3>
            <p class="text-xs text-slate-500">Ingresa el DNI, código o busca por nombre del socio</p>
          </div>
        </div>

        <form @submit.prevent="handleFormSubmit" class="relative mt-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <i class="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl"></i>
              <input
                v-model="query"
                type="text"
                placeholder="Escribe DNI (ej. 74859612) o nombre..."
                autocomplete="off"
                class="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
              <!-- Sugerencias desplegables -->
              <div
                v-if="query.trim().length > 0"
                class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100"
              >
                <div v-if="suggestions.length === 0" class="p-3 text-xs text-slate-500">
                  No se encontró ningún socio con "{{ query }}"
                </div>
                <button
                  v-for="s in suggestions"
                  :key="s.id"
                  type="button"
                  @click="executeCheckIn(s.id)"
                  class="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ s.nombre }}</p>
                    <p class="text-xs text-slate-500">DNI: {{ s.dni }}</p>
                  </div>
                  <span :class="['text-xs font-bold px-2 py-0.5 rounded-full border', s.status.badgeClass]">
                    {{ s.status.label }}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <i class="ph-bold ph-sign-in text-xl"></i>
              <span>Marcar Entrada</span>
            </button>
          </div>
        </form>

        <!-- Resultado Visual de Validación -->
        <div v-if="lastCheckInResult" class="mt-6">
          <!-- Activo -->
          <div
            v-if="lastCheckInResult.status.code === 'activo'"
            class="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 animate-fade-in"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <i class="ph-bold ph-check-circle text-3xl"></i>
                </div>
                <div>
                  <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-700">ACCESO PERMITIDO</span>
                  <h4 class="text-xl font-extrabold text-slate-900 mt-0.5">{{ lastCheckInResult.socio.nombre }}</h4>
                  <p class="text-sm text-emerald-800 font-medium">
                    {{ lastCheckInResult.plan.nombre }} &bull; Le quedan <strong>{{ lastCheckInResult.status.daysLeft }} días</strong>
                  </p>
                </div>
              </div>
              <span class="text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                {{ lastCheckInResult.hora }}
              </span>
            </div>
          </div>

          <!-- Por vencer -->
          <div
            v-else-if="lastCheckInResult.status.code === 'por_vencer'"
            class="p-6 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3.5">
              <div class="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <i class="ph-bold ph-warning text-3xl"></i>
              </div>
              <div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-amber-700">ACCESO PERMITIDO - VENCE PRONTO</span>
                <h4 class="text-xl font-extrabold text-slate-900 mt-0.5">{{ lastCheckInResult.socio.nombre }}</h4>
                <p class="text-sm text-amber-900 font-medium">
                  Vence en {{ lastCheckInResult.status.daysLeft }} día(s) ({{ formatDateHuman(lastCheckInResult.socio.fin) }})
                </p>
              </div>
            </div>
            <button
              @click="store.renovarModalState = { open: true, socioId: lastCheckInResult.socio.id }"
              class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
            >
              Renovar Ahora
            </button>
          </div>

          <!-- Vencido -->
          <div
            v-else
            class="p-6 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-950 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3.5">
              <div class="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <i class="ph-bold ph-prohibit text-3xl"></i>
              </div>
              <div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-rose-700">ACCESO DENEGADO - VENCIDA</span>
                <h4 class="text-xl font-extrabold text-slate-900 mt-0.5">{{ lastCheckInResult.socio.nombre }}</h4>
                <p class="text-sm text-rose-800 font-medium">
                  Venció hace <strong>{{ Math.abs(lastCheckInResult.status.daysLeft) }} día(s)</strong>
                </p>
              </div>
            </div>
            <button
              @click="store.renovarModalState = { open: true, socioId: lastCheckInResult.socio.id }"
              class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
            >
              Renovar Membresía
            </button>
          </div>
        </div>

        <div v-else class="mt-6 p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
          <i class="ph ph-qr-code text-4xl text-slate-300 mx-auto mb-2"></i>
          <p class="text-sm font-medium text-slate-600">Listo para validar ingreso</p>
          <p class="text-xs text-slate-400 mt-1">El sistema verificará automáticamente si la membresía está vigente o vencida.</p>
        </div>
      </div>

      <!-- Acceso Rápido Pills -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Acceso Rápido (Socios Registrados)</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in store.sociosConEstado"
            :key="s.id"
            @click="executeCheckIn(s.id)"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer"
          >
            <span
              :class="[
                'w-2 h-2 rounded-full',
                s.status.code === 'activo' ? 'bg-emerald-500' : s.status.code === 'por_vencer' ? 'bg-amber-500' : 'bg-rose-500'
              ]"
            />
            <span>{{ s.nombre.split(' ')[0] }} ({{ s.dni }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Historial de Asistencias de Hoy (5 columnas) -->
    <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden h-fit max-h-[620px]">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 class="font-bold text-slate-900">Asistencias de Hoy</h3>
          <p class="text-xs text-slate-500">Registro cronológico en tiempo real</p>
        </div>
        <span class="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full">
          {{ store.stats.asistenciasHoy.length }} hoy
        </span>
      </div>

      <div class="divide-y divide-slate-100 overflow-y-auto p-2">
        <div v-if="store.stats.asistenciasHoy.length === 0" class="p-8 text-center text-slate-400">
          <i class="ph ph-clock-countdown text-3xl mb-1"></i>
          <p class="text-xs">Sin registros el día de hoy</p>
        </div>
        <div
          v-for="a in [...store.stats.asistenciasHoy].reverse()"
          :key="a.id"
          class="p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between transition"
        >
          <div>
            <p class="text-sm font-bold text-slate-800">{{ a.nombre }}</p>
            <p class="text-xs text-slate-400">DNI: {{ a.dni }} &bull; {{ a.hora }}</p>
          </div>
          <span
            :class="[
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              a.estado === 'vencido'
                ? 'bg-rose-100 text-rose-700'
                : a.estado === 'por_vencer'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-700'
            ]"
          >
            {{ a.estado === 'vencido' ? 'Vencido' : a.estado === 'por_vencer' ? 'Por vencer' : 'Vigente' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
