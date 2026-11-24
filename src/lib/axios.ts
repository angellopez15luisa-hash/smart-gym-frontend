import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth.store'

const TOKEN_KEY = import.meta.env.VITE_TOKEN
let isRedirecting = false

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const requestUrl = error?.config?.url ?? ''
    const isLoginEndpoint = requestUrl.includes('/auth/login')

    if (status === 401 && !isLoginEndpoint) {
      const authStore = useAuthStore()
      authStore.logout()

      if (!isRedirecting) {
        isRedirecting = true

        const currentPath = router.currentRoute.value.fullPath
        await router.push({
          path: '/login',
          query: currentPath !== '/login' ? { redirect: currentPath } : undefined,
        })

        setTimeout(() => {
          isRedirecting = false
        }, 300)
      }
    }

    return Promise.reject(error)
  },
)

export default api
 