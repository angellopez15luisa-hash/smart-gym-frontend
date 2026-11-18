<script setup lang="ts">
import { ref } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { useRouter } from 'vue-router'

const store = useGymStore()
const router = useRouter()

const username = ref('')
const password = ref('')

function handleLogin() {
  const success = store.login(username.value.trim(), password.value.trim())
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 lg:p-10 space-y-6">

      <!-- Cabecera de Marca -->
      <div class="text-center space-y-3">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          GB
        </div>
        <div>
          <h1 class="text-2xl font-black text-white tracking-tight">GYM BARRIO</h1>
          <p class="text-xs text-slate-400 mt-1">Control Total &bull; Inicia sesión para continuar</p>
        </div>
      </div>

      <!-- Formulario de Acceso -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Usuario</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <i class="ph-bold ph-user text-lg"></i>
            </span>
            <input
              v-model="username"
              type="text"
              required
              placeholder="Ej. miguel.admin o jorge.cashier"
              class="w-full bg-slate-950 text-white pl-11 pr-4 py-3.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contraseña</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <i class="ph-bold ph-lock-key text-lg"></i>
            </span>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full bg-slate-950 text-white pl-11 pr-4 py-3.5 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          <span>Ingresar al Sistema</span>
          <i class="ph-bold ph-arrow-right text-base"></i>
        </button>
      </form>

      <!-- Accesos Rápidos de Prueba -->
      <div class="pt-6 border-t border-slate-800 text-center space-y-3">
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accesos rápidos de prueba:</p>
        <div class="flex justify-center gap-2">
          <button
            type="button"
            @click="username = 'miguel.admin'; password = '12345678'"
            class="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-3 py-2 rounded-xl transition cursor-pointer border border-slate-700/60"
          >
            Admin (miguel.admin)
          </button>
          <button
            type="button"
            @click="username = 'jorge.cashier'; password = '12345678'"
            class="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold px-3 py-2 rounded-xl transition cursor-pointer border border-slate-700/60"
          >
            Cajero (jorge.cashier)
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
