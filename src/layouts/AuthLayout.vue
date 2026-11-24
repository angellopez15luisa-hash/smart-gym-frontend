<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoadingAuthRoute = ref(false)

let removeBeforeGuard: (() => void) | undefined
let removeAfterGuard: (() => void) | undefined
let removeErrorGuard: (() => void) | undefined

const handlePageShow = (event: PageTransitionEvent) => {
  if (event.persisted) {
    isLoadingAuthRoute.value = true
    setTimeout(() => {
      isLoadingAuthRoute.value = false
    }, 100)
  }
}

onMounted(() => {
  removeBeforeGuard = router.beforeEach((to, _from, next) => {
    if (to.path.startsWith('/auth')) {
      isLoadingAuthRoute.value = true
    }
    next()
  })

  removeAfterGuard = router.afterEach(() => {
    setTimeout(() => {
      isLoadingAuthRoute.value = false
    }, 80)
  })

  removeErrorGuard = router.onError(() => {
    isLoadingAuthRoute.value = false
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
  <div
    class="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950 relative"
  >
    <router-view />

    <!-- OVERLAY DE CARGA EN AUTH LAYOUT -->
    <div
      v-if="isLoadingAuthRoute"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm transition-opacity duration-200"
    >
      <div
        class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>
  </div>
</template>
