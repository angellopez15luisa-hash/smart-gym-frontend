<script setup lang="ts">
// defineModel permite enlazar el v-model del componente padre (ej. store.socioModalState.open) directamente
const open = defineModel<boolean>({ required: true })

defineProps<{
  title: string
  maxWidthClass?: string
  headerClass?: string
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      @click.self="open = false"
    >
      <div
        :class="[
          'bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in',
          maxWidthClass || 'max-w-lg'
        ]"
      >
        <!-- Cabecera del Modal -->
        <div :class="['px-6 py-4 border-b border-slate-100 flex items-center justify-between', headerClass || 'bg-slate-50']">
          <h3 class="font-bold text-lg text-slate-900">{{ title }}</h3>
          <button type="button" @click="open = false" class="opacity-70 hover:opacity-100 p-1 rounded-lg cursor-pointer">
            <i class="ph ph-x text-xl"></i>
          </button>
        </div>

        <!-- Contenido dinámico (aquí se inyectan los formularios hijos) -->
        <slot />
      </div>
    </div>
  </Teleport>
</template>
