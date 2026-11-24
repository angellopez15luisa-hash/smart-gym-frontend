<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useGymStore } from '@/stores/useGymStore'
import Swal from "sweetalert2"
import { useAuthStore } from "@/stores/auth.store"

const route = useRoute()
const router = useRouter()
const store = useGymStore()

const authStore = useAuthStore()

function handleCajaAction() {
  if (store.cajaEstado.abierta) {
    store.abrirCorteCajaGlobal()
    if (route.path !== '/admin/caja') {
      router.push('/admin/caja')
    }
  } else {
    router.push('/admin/caja')
  }
}

// Función de Cierre de Sesión
function handleLogout() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Se bloqueará la terminal de venta actual.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar',
  }).then((result) => {
    if (result.isConfirmed) {
      authStore.logout()
      router.replace({ name: 'login' })
    }
  })
}

</script>

<template>
  <div class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
    <div>
      <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
        {{ route.meta.title }}
      </h2>
      <p class="text-xs sm:text-sm text-slate-400 mt-0.5">{{ route.meta.subtitle }}</p>
    </div>

    <div class="flex items-center gap-3">
      <!-- Indicador y Botón Dinámico de Caja -->
      <div
        :class="[
          'flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition',
          store.cajaEstado.abierta
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
            : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
        ]"
      >
        <span
          :class="[
            'w-2.5 h-2.5 rounded-full inline-block',
            store.cajaEstado.abierta ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
          ]"
        ></span>
        <div class="text-xs">
          <p class="font-extrabold leading-tight">
            {{ store.cajaEstado.abierta ? 'Caja Abierta' : 'Caja Cerrada' }}
          </p>
          <p class="text-[10px] opacity-80">
            {{ store.cajaEstado.abierta ? `Base: ${store.formatMoney(store.cajaEstado.montoInicial)}` : 'Bloqueada' }}
          </p>
        </div>

        <button
          @click="handleCajaAction"
          :class="[
            'ml-2 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer shadow-xs',
            store.cajaEstado.abierta
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          ]"
        >
          {{ store.cajaEstado.abierta ? 'Corte y Cierre' : 'Aperturar' }}
        </button>
      </div>

      <!-- Perfil y Sesión de Usuario con Botón Intuitivo -->
      <div class="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-2xl">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-inner uppercase">
          {{ store.currentUser?.rol === 'admin' ? 'MA' : 'JC' }}
        </div>

        <div>
          <span class="text-xs font-bold text-white leading-tight block">
            {{ store.currentUser?.nombre || 'Usuario' }}
          </span>
          <p class="text-[10px] text-slate-400 font-medium capitalize">
            {{ store.currentUser?.rol || 'Invitado' }}
          </p>
        </div>

        <div class="h-6 w-[1px] bg-slate-700 mx-1"></div>

        <button
          @click="handleLogout"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
        >
          <i class="ph-bold ph-sign-out text-sm"></i>
          <span class="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  </div>
</template>
