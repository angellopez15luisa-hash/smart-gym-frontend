<script setup lang="ts">
import { useGymStore } from '@/stores/useGymStore'

// App.vue limpio: solo renderiza el router-view principal de los layouts
import { onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()
const store = useGymStore()

const forceRefresh = (event: PageTransitionEvent) => {
  // persisted es true si la página se cargó desde la memoria RAM (BFCache)
  if (event.persisted) {
    // Opción 1: Forzar a Vue Router a revaluar la ruta actual
    router.go(0)

    // Opción 2: Recarga total del navegador si la caché es muy agresiva
    window.location.reload()
  }
}

onMounted(() => {
  window.addEventListener('pageshow', forceRefresh)
  store.initStore()
})

onUnmounted(() => {
  window.removeEventListener('pageshow', forceRefresh)
})
</script>

<template>
  <RouterView :key="$route.fullPath" />
  <VueQueryDevtools />
</template>
