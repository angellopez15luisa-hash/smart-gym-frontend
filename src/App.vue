<script setup lang="ts">
import { onMounted } from 'vue'
import { useGymStore } from '@/stores/useGymStore'

const store = useGymStore()

onMounted(() => {
  store.initStore()
})
</script>

<template>
  <router-view v-if="store.isLoaded" />
</template>
