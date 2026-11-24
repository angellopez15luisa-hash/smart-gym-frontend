import { createRouter, createWebHistory, type RouteLocationNormalizedGeneric } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CheckInView from '@/views/CheckInView.vue'
import SociosView from '@/views/SociosView.vue'
import PlanesView from '@/views/PlanesView.vue'
import CajaView from '@/views/CajaView.vue'
import ProductosView from '@/views/ProductosView.vue'
import { useAuthStore } from '@/stores/auth.store'

const TOKEN_KEY = import.meta.env.VITE_TOKEN

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/admin',
    },
    {
      path: '/auth',
      component: AuthLayout,
      redirect: { name: 'login' },
      meta: { requiresNotAuth: true },
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
          meta: { title: 'Iniciar Sesión', requiresAuth: false },
        },
      ],
    },
    {
      path: '/admin',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
          meta: {
            title: 'Dashboard Resumen',
            subtitle: 'Vista general del gimnasio y métricas clave',
            roles: ['admin', 'cashier'],
          },
        },
        {
          path: 'checkin',
          name: 'checkin',
          component: CheckInView,
          meta: {
            title: 'Control Asistencia',
            subtitle: 'Registro rápido de ingreso de socios',
            roles: ['admin', 'cashier'],
          },
        },
        {
          path: 'socios',
          name: 'socios',
          component: SociosView,
          meta: {
            title: 'Socios y Clientes',
            subtitle: 'Gestión de miembros, estados y renovaciones',
            roles: ['admin', 'cashier'],
          },
        },
        {
          path: 'planes',
          name: 'planes',
          component: PlanesView,
          meta: {
            title: 'Planes y Tarifas',
            subtitle: 'Configuración de membresías y precios',
            roles: ['admin'],
          },
        },
        {
          path: 'caja',
          name: 'caja',
          component: CajaView,
          meta: {
            title: 'Caja y Pagos',
            subtitle: 'Flujo de ingresos, egresos y arqueo diario',
            roles: ['admin', 'cashier'],
          },
        },
        {
          path: 'productos',
          name: 'productos-modulo',
          redirect: '/admin/productos/pos',
          children: [
            {
              path: 'pos',
              name: 'productos-pos',
              component: ProductosView,
              meta: {
                title: 'Punto de Venta (POS)',
                subtitle: 'Venta rápida de productos y cobro en mostrador',
                roles: ['admin', 'cashier'],
              },
            },
            {
              path: 'catalogo',
              name: 'productos-catalogo',
              component: () => import('@/views/CatalogoProductosView.vue'),
              meta: {
                title: 'Catálogo y Maestros',
                subtitle: 'Administración de productos, precios y categorías',
                roles: ['admin'],
              },
            },
            {
              path: 'ventas',
              name: 'productos-ventas',
              component: () => import('@/views/VentasView.vue'),
              meta: {
                title: 'Historial de Ventas',
                subtitle: 'Listado de tickets cobrados y anulación de ventas',
                roles: ['admin'],
              },
            },
            {
              path: 'kardex',
              name: 'productos-kardex',
              component: () => import('@/views/KardexView.vue'),
              meta: {
                title: 'Kardex e Inventario',
                subtitle: 'Movimientos de entradas, salidas y ajustes de stock',
                roles: ['admin'],
              },
            },
          ],
        },
      ],
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/admin',
    },
  ],
})

// 🛡️ Guard Global de Navegación con validación de Roles
router.beforeEach(
  async (to: RouteLocationNormalizedGeneric, _from: RouteLocationNormalizedGeneric) => {
    const isAuth = await isAuthenticated()

    if (to.meta.requiresAuth && !isAuth) {
      localStorage.removeItem(TOKEN_KEY)
      return { name: 'login' }
    }

    if (to.meta.requiresNotAuth && isAuth) {
      return { name: 'dashboard' }
    }

    // Validación de Roles por Ruta
    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const authStore = useAuthStore()
      const userRole = authStore.user?.role?.toLowerCase() // Normalizamos a minúsculas ('admin' / 'cashier')

      // Evitamos redirección infinita si ya vamos hacia 'dashboard'
      if (!userRole || !to.meta.roles.includes(userRole)) {
        if (to.name !== 'dashboard') {
          return { name: 'dashboard' }
        }
        return false
      }
    }

    return true
  },
)

async function isAuthenticated(): Promise<boolean> {
  try {
    const authStore = useAuthStore()
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return false

    if (authStore.isAuthenticated) return true

    await authStore.checkAuth()
    return authStore.isAuthenticated
  } catch {
    return false
  }
}

export default router
