<script setup lang="ts">
import { ref } from 'vue'
import Navbar from '@/components/layout/Navbar.vue'
import HeaderToolbar from '@/components/layout/HeaderToolbar.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import SocioModal from '@/components/modals/SocioModal.vue'
import RenovarModal from '@/components/modals/RenovarModal.vue'

const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
    <ToastContainer />

    <!-- Header Móvil Superior -->
    <header class="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
          <i class="ph-bold ph-barbell text-xl"></i>
        </div>
        <div>
          <h1 class="font-bold text-base leading-tight">Gym Control</h1>
          <p class="text-[11px] text-slate-400">Gestión de Barrio</p>
        </div>
      </div>
      <button @click="mobileMenuOpen = !mobileMenuOpen" class="p-2 rounded-xl bg-slate-800 text-slate-200 cursor-pointer">
        <i class="ph ph-list text-2xl"></i>
      </button>
    </header>

    <!-- 1. NAVBAR (Sidebar Lateral) -->
    <Navbar
      :mobile-menu-open="mobileMenuOpen"
      @close-mobile="mobileMenuOpen = false"
    />

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
  </div>
</template>
