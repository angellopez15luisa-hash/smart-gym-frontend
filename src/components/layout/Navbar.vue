<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGymStore } from '@/stores/useGymStore'
import { useAuthStore } from '@/stores/auth.store'

defineProps<{
  mobileMenuOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'closeMobile'): void
}>()

const store = useGymStore()
const authStore = useAuthStore()
const route = useRoute()

const productosOpen = ref(route.path.startsWith('/admin/productos'))

const currentRole = computed(() => authStore.user?.role?.toLowerCase() || 'cashier')

const navItems = computed(() => {
  const rol = currentRole.value

  const items = [
    {
      to: '/admin',
      label: 'Dashboard Resumen',
      icon: 'ph-fill ph-squares-four',
      roles: ['admin', 'cashier'],
    },
    {
      to: '/admin/checkin',
      label: 'Control Asistencia',
      icon: 'ph-bold ph-qr-code',
      roles: ['admin', 'cashier'],
    },
    {
      to: '/admin/socios',
      label: 'Socios y Clientes',
      icon: 'ph-bold ph-users',
      showVencidos: true,
      roles: ['admin', 'cashier'],
    },
    {
      to: '/admin/planes',
      label: 'Planes y Tarifas',
      icon: 'ph-bold ph-ticket',
      roles: ['admin'],
    },
    {
      to: '/admin/caja',
      label: 'Caja y Pagos',
      icon: 'ph-bold ph-cash-register',
      roles: ['admin', 'cashier'],
    },
  ]

  return items.filter((i) => i.roles.includes(rol))
})

const isAdmin = computed(() => currentRole.value === 'admin')
const isProductosActive = computed(() => route.path.startsWith('/admin/productos'))
</script>

<template>
  <div
    v-if="mobileMenuOpen"
    @click="emit('closeMobile')"
    class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden"
  />

  <aside
    :class="[
      'fixed md:sticky top-0 left-0 z-40 h-screen w-68 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 shrink-0 shadow-xl md:shadow-none',
      mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <div>
      <div class="p-5 flex items-center justify-between border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            <i class="ph-bold ph-barbell text-2xl"></i>
          </div>
          <div>
            <h1 class="font-extrabold text-white text-lg tracking-tight leading-none">
              GYM BARRIO
            </h1>
            <span class="text-xs font-medium text-emerald-400">Control Total v4</span>
          </div>
        </div>
        <button
          @click="emit('closeMobile')"
          class="md:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          <i class="ph ph-x text-xl"></i>
        </button>
      </div>

      <nav class="p-3 space-y-1 mt-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="emit('closeMobile')"
          v-slot="{ isExactActive }"
        >
          <div
            :class="[
              'w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer',
              isExactActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-xs'
                : 'hover:bg-slate-800/80 hover:text-white text-slate-400',
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <i
                :class="[
                  item.icon,
                  'text-lg shrink-0',
                  isExactActive ? 'text-emerald-400' : 'text-slate-500',
                ]"
              ></i>
              <span class="truncate whitespace-nowrap">{{ item.label }}</span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <span
                v-if="item.showVencidos && store.stats.vencidos > 0"
                class="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400"
              >
                {{ store.stats.vencidos }}
              </span>
            </div>
          </div>
        </RouterLink>

        <div class="pt-1">
          <button
            @click="productosOpen = !productosOpen"
            :class="[
              'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer',
              isProductosActive && !productosOpen
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-xs'
                : 'hover:bg-slate-800/80 hover:text-white text-slate-400',
            ]"
          >
            <div class="flex items-center gap-3">
              <i
                :class="[
                  'text-lg ph-bold ph-storefront shrink-0',
                  isProductosActive ? 'text-emerald-400' : 'text-slate-500',
                ]"
              ></i>
              <span class="whitespace-nowrap">Barra / POS</span>
            </div>
            <i
              :class="[
                'ph-bold ph-caret-down text-xs transition-transform duration-200 text-slate-400',
                productosOpen ? 'rotate-180 text-emerald-400' : '',
              ]"
            ></i>
          </button>

          <div
            v-show="productosOpen"
            class="pl-4 mt-1 space-y-1 border-l-2 border-slate-800 ml-5"
          >
            <RouterLink
              to="/admin/productos/pos"
              @click="emit('closeMobile')"
              v-slot="{ isExactActive }"
            >
              <div
                :class="[
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  isExactActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                ]"
              >
                <i class="ph-bold ph-shopping-cart text-sm shrink-0"></i>
                <span class="whitespace-nowrap">Punto de Venta (POS)</span>
              </div>
            </RouterLink>

            <RouterLink
              v-if="isAdmin"
              to="/admin/productos/catalogo"
              @click="emit('closeMobile')"
              v-slot="{ isExactActive }"
            >
              <div
                :class="[
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  isExactActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                ]"
              >
                <i class="ph-bold ph-package text-sm shrink-0"></i>
                <span class="whitespace-nowrap">Catálogo y Maestros</span>
              </div>
            </RouterLink>

            <RouterLink
              v-if="isAdmin"
              to="/admin/productos/ventas"
              @click="emit('closeMobile')"
              v-slot="{ isExactActive }"
            >
              <div
                :class="[
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  isExactActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                ]"
              >
                <i class="ph-bold ph-receipt text-sm shrink-0"></i>
                <span class="whitespace-nowrap">Historial de Ventas</span>
              </div>
            </RouterLink>

            <RouterLink
              v-if="isAdmin"
              to="/admin/productos/kardex"
              @click="emit('closeMobile')"
              v-slot="{ isExactActive }"
            >
              <div
                :class="[
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  isExactActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                ]"
              >
                <i class="ph-bold ph-clipboard-text text-sm shrink-0"></i>
                <span class="whitespace-nowrap">Kardex y Movimientos</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </nav>
    </div>

    <div class="p-4 border-t border-slate-800 space-y-3 bg-slate-900/50">
      <div class="flex items-center justify-between bg-slate-800/70 px-3 py-2 rounded-xl">
        <span class="text-xs text-slate-400">Moneda local:</span>
        <select
          v-model="store.currency"
          class="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="S/">S/ (Soles)</option>
          <option value="$">$ (Pesos/USD)</option>
          <option value="€">€ (Euros)</option>
          <option value="Bs">Bs (Bolivianos)</option>
          <option value="Q">Q (Quetzales)</option>
        </select>
      </div>

      <div v-if="isAdmin" class="grid grid-cols-2 gap-2">
        <button
          @click="store.exportJSON()"
          class="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
        >
          <i class="ph ph-download-simple text-sm"></i>
          <span>Respaldar</span>
        </button>
        <button
          @click="store.resetDemoData(true)"
          class="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-xs font-medium text-slate-400 transition cursor-pointer"
        >
          <i class="ph ph-arrows-counter-clockwise text-sm"></i>
          <span>Demo Reset</span>
        </button>
      </div>
    </div>
  </aside>
</template>
