<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/layout/Navbar.vue'
import HeaderToolbar from '@/components/layout/HeaderToolbar.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import SocioModal from '@/components/modals/SocioModal.vue'
import RenovarModal from '@/components/modals/RenovarModal.vue'

const router = useRouter()
const mobileMenuOpen = ref(false)
const isLoadingRoute = ref(false)

let removeBeforeGuard: (() => void) | undefined
let removeAfterGuard: (() => void) | undefined
let removeErrorGuard: (() => void) | undefined

const handlePageShow = (event: PageTransitionEvent) => {
  if (event.persisted) {
    isLoadingRoute.value = true
    setTimeout(() => {
      isLoadingRoute.value = false
    }, 100)
  }
}

onMounted(() => {
  removeBeforeGuard = router.beforeEach((to, _from, next) => {
    if (to.path.startsWith('/admin')) {
      isLoadingRoute.value = true
    }
    next()
  })

  removeAfterGuard = router.afterEach(() => {
    setTimeout(() => {
      isLoadingRoute.value = false
    }, 80)
  })

  removeErrorGuard = router.onError(() => {
    isLoadingRoute.value = false
  })

  window.addEventListener('pageshow', handlePageShow)
})

onUnmounted(() => {
  removeBeforeGuard?.()
  removeAfterGuard?.()
  removeErrorGuard?.()
  window.removeEventListener('pageshow', handlePageShow)
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 relative">
    <ToastContainer />

    <!-- Header Móvil Superior -->
    <header
      class="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold"
        >
          <i class="ph-bold ph-barbell text-xl"></i>
        </div>
        <div>
          <h1 class="font-bold text-base leading-tight">Gym Control</h1>
          <p class="text-[11px] text-slate-400">Gestión de Barrio</p>
        </div>
      </div>
      <button
        @click="mobileMenuOpen = !mobileMenuOpen"
        class="p-2 rounded-xl bg-slate-800 text-slate-200 cursor-pointer"
      >
        <i class="ph ph-list text-2xl"></i>
      </button>
    </header>

    <!-- 1. NAVBAR (Sidebar Lateral) -->
    <Navbar :mobile-menu-open="mobileMenuOpen" @close-mobile="mobileMenuOpen = false" />

    <!-- CONTENEDOR DERECHO: Header Toolbar + RouterView -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- 2. HEADER TOOLBAR (Barra Superior Oscura) -->
      <HeaderToolbar />

      <!-- 3. ÁREA DE VISTA PRINCIPAL (RouterView) -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 w-full">
        <RouterView />
      </main>
    </div>

    <!-- Modales Globales -->
    <SocioModal />
    <RenovarModal />

    <!-- OVERLAY DE CARGA DEL LAYOUT -->
    <div
      v-if="isLoadingRoute"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm transition-opacity duration-200"
    >
      <div
        class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>
  </div>
</template>
