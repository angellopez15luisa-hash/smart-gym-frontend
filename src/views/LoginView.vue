<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { configure, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth.store'
import { authLoginSchema } from '@/schemas'
import { authLoginFormValue } from '@/values'
import { AuthAction } from '@/business/actions'

configure({
  validateOnBlur: false,
})

const authStore = useAuthStore()
const textInputRef = ref<HTMLInputElement | null>(null)
const isRedirecting = ref(false)

const { handleSubmit, defineField, errors, resetForm, setValues } = useForm({
  validationSchema: toTypedSchema(authLoginSchema),
  initialValues: authLoginFormValue,
})

const [username] = defineField('username')
const [password] = defineField('password')

const { mutate, isPending } = useMutation({
  mutationFn: AuthAction.login,
  onSuccess: async () => {
    resetForm()
    await authStore.checkAuth()

    isRedirecting.value = true

    setTimeout(() => {
      window.location.href = '/admin'
    }, 150)
  },
  onError: (error) => {
    toast.error(error.message)
  },
})

const onSubmit = handleSubmit((values) => {
  mutate(values)
})

function fillTestUser(user: string, pass: string) {
  setValues({
    username: user,
    password: pass,
  })
}

onMounted(() => {
  textInputRef.value?.focus()
})
</script>

<template>
  <div
    class="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 antialiased relative"
  >
    <!-- Espaciador superior -->
    <div class="h-4"></div>

    <!-- Tarjeta Principal del Login -->
    <main class="w-full max-w-md relative z-10 my-auto py-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-7">
        <!-- Cabecera de Marca -->
        <div class="flex flex-col items-center text-center space-y-3">
          <div
            class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
          >
            GB
          </div>
          <div>
            <h1 class="text-2xl font-black text-white tracking-tight">GYM BARRIO</h1>
            <p class="text-xs text-emerald-400 font-semibold tracking-wider uppercase mt-0.5">
              Control Total &bull; Inicia sesión para continuar
            </p>
          </div>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="onSubmit" class="space-y-5">
          <!-- Input Usuario -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Usuario
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <i class="ph-bold ph-user text-lg"></i>
              </span>
              <input
                ref="textInputRef"
                v-model="username"
                type="text"
                placeholder="Ej. miguel.admin o jorge.cashier"
                :class="[
                  'w-full pl-11 pr-4 py-3 bg-slate-950 rounded-xl text-xs text-slate-100 placeholder-slate-600 font-medium transition outline-none',
                  errors.username
                    ? 'border-2 border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border border-slate-800 focus:border-emerald-500',
                ]"
              />
            </div>
            <span
              v-if="errors.username"
              class="text-red-400 text-xs font-semibold flex items-center gap-1.5 mt-1 ml-1 animate-pulse"
            >
              <i class="ph-bold ph-warning-circle text-xs"></i>
              {{ errors.username }}
            </span>
          </div>

          <!-- Input Contraseña -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Contraseña
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <i class="ph-bold ph-lock-key text-lg"></i>
              </span>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                :class="[
                  'w-full pl-11 pr-11 py-3 bg-slate-950 rounded-xl text-xs text-slate-100 placeholder-slate-600 font-medium transition outline-none',
                  errors.password
                    ? 'border-2 border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border border-slate-800 focus:border-emerald-500',
                ]"
              />
            </div>
            <span
              v-if="errors.password"
              class="text-red-400 text-xs font-semibold flex items-center gap-1.5 mt-1 ml-1 animate-pulse"
            >
              <i class="ph-bold ph-warning-circle text-xs"></i>
              {{ errors.password }}
            </span>
          </div>

          <!-- Botón de Submit -->
          <button
            type="submit"
            :disabled="isPending || isRedirecting"
            class="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-7 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Ingresar al Sistema</span>
            <i class="ph-bold ph-arrow-right text-sm"></i>
          </button>
        </form>

        <!-- Accesos Rápidos de Prueba -->
        <div class="pt-5 border-t border-slate-800 text-center space-y-3">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Accesos rápidos de prueba:
          </p>
          <div class="flex justify-center gap-2">
            <button
              type="button"
              @click="fillTestUser('miguel.admin', '12345678')"
              class="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-3 py-2 rounded-xl transition cursor-pointer border border-slate-700/60"
            >
              Admin (miguel.admin)
            </button>
            <button
              type="button"
              @click="fillTestUser('jorge.cashier', '12345678')"
              class="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold px-3 py-2 rounded-xl transition cursor-pointer border border-slate-700/60"
            >
              Cajero (jorge.cashier)
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer Inferior -->
    <footer
      class="w-full max-w-md flex justify-between items-center py-3 text-xs text-slate-500 border-t border-slate-900/80 relative z-10"
    >
      <span>© 2026 Gym Barrio</span>
      <span class="text-slate-400 font-medium">Sistema de Gestión</span>
    </footer>

    <!-- OVERLAY DE TRANSICIÓN PARA OCULTAR EL PARPADEO BLANCO -->
    <div
      v-if="isRedirecting"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm transition-all duration-300"
    >
      <div
        class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"
      ></div>
      <p class="text-white text-sm font-bold tracking-wide">Iniciando sesión en Gym Barrio...</p>
      <p class="text-xs text-slate-400 mt-1">Cargando panel administrativo</p>
    </div>
  </div>
</template>
