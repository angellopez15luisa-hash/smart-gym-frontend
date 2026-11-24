import { AuthAction } from '@/business/actions'
import { authProfileResponseSchema } from '@/schemas'
import type { Auth } from '@/types'
import { authValue } from '@/values'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Auth>(authValue)
  const isAuthenticated = ref<boolean>(false)

  const checkAuth = async (): Promise<void> => {
    try {
      const data = await AuthAction.profile()
      const response = authProfileResponseSchema.safeParse(data)
      if (response.success) {
        user.value = response.data
        isAuthenticated.value = true
      }
    } catch {
      isAuthenticated.value = false
    }
  }

  const logout = () => {
    user.value = authValue
    isAuthenticated.value = false
    localStorage.removeItem(import.meta.env.VITE_TOKEN)
  }

  return {
    checkAuth,
    user,
    isAuthenticated,
    logout,
  }
})
