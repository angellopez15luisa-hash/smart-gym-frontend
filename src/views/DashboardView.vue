<script setup lang="ts">
import { computed } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { formatDateHuman } from '@/utils/dateUtils'

const store = useGymStore()

const alertSocios = computed(() =>
  store.sociosConEstado
    .filter(s => s.status.code === 'por_vencer' || s.status.code === 'vencido')
    .sort((a, b) => a.status.daysLeft - b.status.daysLeft)
    .slice(0, 6)
)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Socios Activos</p>
          <h3 class="text-3xl font-extrabold text-slate-900 mt-1.5">{{ store.stats.activosVigentes }}</h3>
          <p class="text-xs text-slate-500 mt-1">De {{ store.stats.totalSocios }} registrados</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <i class="ph-fill ph-users-three text-2xl"></i>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Por Vencer (5 días)</p>
          <h3 class="text-3xl font-extrabold text-amber-600 mt-1.5">{{ store.stats.porVencer }}</h3>
          <p class="text-xs text-rose-500 font-medium mt-1">{{ store.stats.vencidos }} vencidos actualmente</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <i class="ph-fill ph-warning-circle text-2xl"></i>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Ingresos del Mes</p>
          <h3 class="text-3xl font-extrabold text-slate-900 mt-1.5">{{ store.formatMoney(store.stats.ingresosMes) }}</h3>
          <p class="text-xs text-emerald-600 font-medium mt-1">Hoy: {{ store.formatMoney(store.stats.ingresosHoy) }}</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <i class="ph-fill ph-wallet text-2xl"></i>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Asistencias Hoy</p>
          <h3 class="text-3xl font-extrabold text-slate-900 mt-1.5">{{ store.stats.asistenciasHoy.length }}</h3>
          <p class="text-xs text-slate-500 mt-1">Ingresos registrados hoy</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <i class="ph-fill ph-sneaker-move text-2xl"></i>
        </div>
      </div>
    </div>

    <!-- Fila Inferior -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h3 class="font-bold text-slate-900">Alertas de Renovación</h3>
          </div>
          <RouterLink to="/socios" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            Ver todos &rarr;
          </RouterLink>
        </div>

        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th class="py-3 px-4">Socio</th>
                <th class="py-3 px-4">Plan</th>
                <th class="py-3 px-4">Vencimiento</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr v-if="alertSocios.length === 0">
                <td colspan="5" class="py-8 text-center text-slate-400 text-sm">
                  ¡Todo al día! No hay membresías vencidas ni por vencer pronto.
                </td>
              </tr>
              <tr v-for="s in alertSocios" :key="s.id" class="hover:bg-slate-50/80 transition">
                <td class="py-3 px-4">
                  <p class="font-semibold text-slate-900">{{ s.nombre }}</p>
                  <p class="text-xs text-slate-400">DNI: {{ s.dni }}</p>
                </td>
                <td class="py-3 px-4 text-xs font-medium text-slate-600">{{ s.plan.nombre }}</td>
                <td class="py-3 px-4 text-xs font-semibold text-slate-700">{{ formatDateHuman(s.fin) }}</td>
                <td class="py-3 px-4">
                  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border', s.status.badgeClass]">
                    {{ s.status.label }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    @click="store.renovarModalState = { open: true, socioId: s.id }"
                    class="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <i class="ph-bold ph-arrows-clockwise"></i>
                    <span>Renovar</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lateral derecho Dashboard -->
      <div class="space-y-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900 flex items-center gap-2">
              <i class="ph-fill ph-lightning text-amber-500"></i>
              Venta Rápida Barra
            </h3>
            <RouterLink to="/productos" class="text-xs font-semibold text-slate-500 hover:text-slate-800">Inventario</RouterLink>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="p in store.productos.slice(0, 4)"
              :key="p.id"
              :disabled="p.stock <= 0"
              @click="store.venderProductoRapido(p.id)"
              class="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition flex flex-col justify-between disabled:opacity-40 cursor-pointer"
            >
              <span class="text-xs font-bold text-slate-800 line-clamp-1">{{ p.nombre }}</span>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs font-extrabold text-emerald-600">{{ store.formatMoney(p.precio) }}</span>
                <span class="text-[10px] text-slate-400">Stock: {{ p.stock }}</span>
              </div>
            </button>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-slate-900">Últimos Ingresos Hoy</h3>
            <RouterLink to="/checkin" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Ir a Check-in</RouterLink>
          </div>
          <div v-if="store.stats.asistenciasHoy.length === 0" class="text-xs text-slate-400 text-center py-4">
            Aún no hay asistencias registradas hoy.
          </div>
          <div v-else class="space-y-2.5">
            <div
              v-for="a in [...store.stats.asistenciasHoy].reverse().slice(0, 4)"
              :key="a.id"
              class="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span
                  :class="[
                    'w-2 h-2 rounded-full shrink-0',
                    a.estado === 'vencido' ? 'bg-rose-500' : a.estado === 'por_vencer' ? 'bg-amber-500' : 'bg-emerald-500'
                  ]"
                />
                <p class="text-xs font-semibold text-slate-800 truncate">{{ a.nombre }}</p>
              </div>
              <span class="text-[11px] font-mono text-slate-500 ml-2 shrink-0">{{ a.hora }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
