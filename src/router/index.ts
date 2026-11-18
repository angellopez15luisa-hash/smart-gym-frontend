import { createRouter, createWebHistory } from 'vue-router'
import { useGymStore } from '@/stores/useGymStore'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CheckInView from '@/views/CheckInView.vue'
import SociosView from '@/views/SociosView.vue'
import PlanesView from '@/views/PlanesView.vue'
import CajaView from '@/views/CajaView.vue'
import ProductosView from '@/views/ProductosView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      component: AuthLayout,
      redirect: { name: 'login' },
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
          meta: { title: 'Iniciar Sesión', requiresAuth: false }
        }
      ]
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
          meta: { title: 'Dashboard Resumen', subtitle: 'Vista general del gimnasio y métricas clave', roles: ['admin', 'cajero'] }
        },
        {
          path: 'checkin',
          name: 'checkin',
          component: CheckInView,
          meta: { title: 'Control Asistencia', subtitle: 'Registro rápido de ingreso de socios', roles: ['admin', 'cajero'] }
        },
        {
          path: 'socios',
          name: 'socios',
          component: SociosView,
          meta: { title: 'Socios y Clientes', subtitle: 'Gestión de miembros, estados y renovaciones', roles: ['admin', 'cajero'] }
        },
        {
          path: 'planes',
          name: 'planes',
          component: PlanesView,
          meta: { title: 'Planes y Tarifas', subtitle: 'Configuración de membresías y precios', roles: ['admin'] }
        },
        {
          path: 'caja',
          name: 'caja',
          component: CajaView,
          meta: { title: 'Caja y Pagos', subtitle: 'Flujo de ingresos, egresos y arqueo diario', roles: ['admin', 'cajero'] }
        },
        {
          path: 'productos',
          name: 'productos-modulo',
          redirect: '/productos/pos',
          children: [
            {
              path: 'pos',
              name: 'productos-pos',
              component: ProductosView,
              meta: { title: 'Punto de Venta (POS)', subtitle: 'Venta rápida de productos y cobro en mostrador', roles: ['admin', 'cajero'] }
            },
            {
              path: 'catalogo',
              name: 'productos-catalogo',
              component: () => import('@/views/CatalogoProductosView.vue'),
              meta: { title: 'Catálogo y Maestros', subtitle: 'Administración de productos, precios y categorías', roles: ['admin'] }
            },
            {
              path: 'ventas',
              name: 'productos-ventas',
              component: () => import('@/views/VentasView.vue'),
              meta: { title: 'Historial de Ventas', subtitle: 'Listado de tickets cobrados y anulación de ventas', roles: ['admin'] }
            },
            {
              path: 'kardex',
              name: 'productos-kardex',
              component: () => import('@/views/KardexView.vue'),
              meta: { title: 'Kardex e Inventario', subtitle: 'Movimientos de entradas, salidas y ajustes de stock', roles: ['admin'] }
            }
          ]
        }
      ]
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const store = useGymStore()

  if (to.meta.requiresAuth && !store.currentUser) {
    next('/auth/login')
  } else if (to.path === '/auth/login' && store.currentUser) {
    next('/')
  } else if (to.meta.roles && store.currentUser) {
    const allowedRoles = to.meta.roles as string[]
    if (!allowedRoles.includes(store.currentUser.rol)) {
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
 
