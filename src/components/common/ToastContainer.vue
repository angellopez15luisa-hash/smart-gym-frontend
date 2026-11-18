<script setup lang="ts">
import { useGymStore } from '@/stores/useGymStore'
const store = useGymStore()

const styles = {
  success: 'bg-slate-900 text-white border-emerald-500',
  warning: 'bg-amber-950 text-amber-50 border-amber-500',
  error: 'bg-rose-950 text-rose-50 border-rose-500'
}
const icons = {
  success: 'ph-fill ph-check-circle text-emerald-400',
  warning: 'ph-fill ph-warning text-amber-400',
  error: 'ph-fill ph-x-circle text-rose-400'
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
    <div
      v-for="t in store.toasts"
      :key="t.id"
      :class="['pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 shadow-xl text-sm font-medium animate-fade-in', styles[t.type]]"
    >
      <i :class="[icons[t.type], 'text-xl']"></i>
      <span>{{ t.message }}</span>
    </div>
  </div>
</template>
