<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import { useRouter } from 'vue-router'

const store = useGymStore()
const router = useRouter()

// Estado del POS
const searchTerm = ref('')
const selectedCategory = ref('todos')
const cart = ref<Array<{ id: string; nombre: string; precio: number; quantity: number; stock: number }>>([])
const paymentMethod = ref<'Efectivo' | 'Yape' | 'Plin' | 'Transferencia'>('Efectivo')
const cashReceived = ref<number | null>(null)

// Input rápido para aperturar caja directo desde el POS
const montoInicialRapido = ref<number>(50)

function handleAperturaRapida() {
  store.abrirCaja(Number(montoInicialRapido.value) || 0)
}

// Categorías dinámicas basadas en los productos existentes
const categories = computed(() => {
  const uniqueCats = new Set(store.productos.map(p => p.categoria).filter(Boolean))
  return ['todos', ...Array.from(uniqueCats)]
})

// Productos filtrados
const filteredProducts = computed(() => {
  return store.productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'todos' || p.categoria === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

// Total del carrito
const cartTotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.precio * item.quantity, 0)
})

// Cantidad total de artículos
const totalItemsCount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

// Vuelto calculado
const changeDue = computed(() => {
  if (!cashReceived.value || cashReceived.value < cartTotal.value) return 0
  return cashReceived.value - cartTotal.value
})

// Agregar producto al carrito
function addToCart(product: any) {
  if (!store.cajaEstado.abierta) return

  if (product.stock <= 0) {
    store.notify('Producto sin stock disponible', 'error')
    return
  }

  const existing = cart.value.find(item => item.id === product.id)
  if (existing) {
    if (existing.quantity < product.stock) {
      existing.quantity++
    } else {
      store.notify(`Stock máximo alcanzado (${product.stock} unid.)`, 'warning')
    }
  } else {
    cart.value.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      quantity: 1,
      stock: product.stock
    })
  }
}

// Modificar cantidad en carrito
function updateQuantity(item: any, delta: number) {
  const newQty = item.quantity + delta
  if (newQty <= 0) {
    cart.value = cart.value.filter(i => i.id !== item.id)
  } else if (newQty <= item.stock) {
    item.quantity = newQty
  } else {
    store.notify(`Solo quedan ${item.stock} unidades en stock`, 'warning')
  }
}

// Eliminar producto por completo del carrito
function removeFromCart(id: string) {
  cart.value = cart.value.filter(i => i.id !== id)
}

// Procesar Venta
function processSale() {
  if (!store.cajaEstado.abierta || cart.value.length === 0) return

  if (paymentMethod.value === 'Efectivo' && cashReceived.value !== null && cashReceived.value < cartTotal.value) {
    store.notify('El monto recibido es menor al total a cobrar', 'error')
    return
  }

  store.checkoutBarSale({
    items: [...cart.value],
    total: cartTotal.value,
    paymentMethod: paymentMethod.value,
    date: new Date().toISOString()
  })

  // Limpiar estado
  cart.value = []
  cashReceived.value = null
}
</script>

<template>
  <div class="relative min-h-[calc(100vh-130px)]">
    <!-- OVERLAY CONTENIDO SOLO DENTRO DEL POS (Deja el menú lateral y header totalmente libres) -->
    <div
      v-if="!store.cajaEstado.abierta"
      class="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs rounded-2xl flex items-center justify-center p-4 animate-fade-in"
    >
      <div class="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 text-center space-y-5">
        <div class="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto text-3xl shadow-xs">
          <i class="ph-bold ph-lock-key"></i>
        </div>

        <div class="space-y-1.5">
          <span class="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
            Caja Cerrada
          </span>
          <h2 class="text-xl font-black text-slate-900">Apertura de Caja Requerida</h2>
          <p class="text-xs text-slate-500 leading-relaxed">
            Para habilitar el Punto de Venta y empezar a cobrar productos, ingresa el monto inicial (fondo de vuelto) en gaveta.
          </p>
        </div>

        <form @submit.prevent="handleAperturaRapida" class="space-y-4 text-left">
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90">
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Fondo Inicial / Sencillo en Gaveta ({{ store.currency }})
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">
                {{ store.currency }}
              </span>
              <input
                v-model.number="montoInicialRapido"
                type="number"
                step="0.50"
                min="0"
                required
                placeholder="0.00"
                class="w-full bg-white text-slate-900 font-mono text-lg font-black pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <i class="ph-bold ph-lock-open text-lg"></i>
            <span>Aperturar Caja y Empezar a Vender</span>
          </button>
        </form>

        <div class="pt-1">
          <button
            type="button"
            @click="router.push('/')"
            class="text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            &larr; Volver al Dashboard
          </button>
        </div>
      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL DEL POS -->
    <div
      :class="[
        'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start transition-all duration-200',
        !store.cajaEstado.abierta ? 'pointer-events-none select-none opacity-30' : ''
      ]"
    >
      <!-- IZQUIERDA (8 columnas): Buscador, Categorías y Catálogo -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Barra de búsqueda y pestañas de categoría -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div class="relative">
            <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar bebida, proteína, snack o accesorio..."
              class="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-sm transition"
            />
            <button
              v-if="searchTerm"
              @click="searchTerm = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i class="ph-bold ph-x text-sm"></i>
            </button>
          </div>

          <!-- Filtros de categoría -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              v-for="cat in categories"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition cursor-pointer',
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              ]"
            >
              {{ cat === 'todos' ? 'Todos los productos' : cat }}
            </button>
          </div>
        </div>

        <!-- Grid de Productos -->
        <div v-if="filteredProducts.length === 0" class="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
          <i class="ph ph-package text-4xl text-slate-300 mb-2 block"></i>
          <p class="text-slate-600 font-semibold text-sm">No se encontraron productos</p>
          <p class="text-slate-400 text-xs mt-1">Intenta con otro término de búsqueda o categoría.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            @click="addToCart(product)"
            :disabled="product.stock <= 0"
            :class="[
              'text-left bg-white border p-4 rounded-2xl flex flex-col justify-between transition-all duration-150 group relative overflow-hidden',
              product.stock > 0
                ? 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/5 cursor-pointer active:scale-[0.99]'
                : 'border-slate-200/60 opacity-60 cursor-not-allowed bg-slate-50'
            ]"
          >
            <div>
              <!-- Top: Categoría y Stock -->
              <div class="flex items-center justify-between gap-2 mb-2.5">
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {{ product.categoria || 'General' }}
                </span>
                <span
                  :class="[
                    'text-[11px] font-bold px-2 py-0.5 rounded-md',
                    product.stock <= 0
                      ? 'bg-rose-100 text-rose-700'
                      : product.stock <= 5
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-700'
                  ]"
                >
                  {{ product.stock <= 0 ? 'Agotado' : `${product.stock} disp.` }}
                </span>
              </div>

              <!-- Nombre del Producto -->
              <h3 class="font-bold text-slate-800 text-sm leading-snug group-hover:text-emerald-700 transition line-clamp-2">
                {{ product.nombre }}
              </h3>
            </div>

            <!-- Bottom: Precio y Botón "+" -->
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-base font-black text-slate-900 font-mono">
                {{ store.formatMoney(product.precio) }}
              </span>

              <span
                :class="[
                  'w-8 h-8 rounded-xl flex items-center justify-center transition',
                  product.stock > 0
                    ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
                    : 'bg-slate-100 text-slate-400'
                ]"
              >
                <i class="ph-bold ph-plus text-sm"></i>
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- DERECHA (4 columnas): Ticket / Resumen de Venta -->
      <div class="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col justify-between sticky top-6 h-[calc(100vh-130px)]">
        <div class="flex flex-col h-full overflow-hidden">
          <!-- Cabecera del Ticket -->
          <div class="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-xs">
                <i class="ph-bold ph-receipt"></i>
              </div>
              <div>
                <h2 class="font-black text-slate-900 text-base tracking-tight">Ticket de Venta</h2>
                <p class="text-xs font-semibold text-slate-500 mt-0.5">
                  {{ totalItemsCount === 0 ? 'Sin artículos' : `${totalItemsCount} artículo(s) en lista` }}
                </p>
              </div>
            </div>

            <button
              v-if="cart.length > 0"
              @click="cart = []; cashReceived = null"
              class="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Vaciar
            </button>
          </div>

          <!-- Lista de Items -->
          <div class="p-4 space-y-3 overflow-y-auto flex-1">
            <div v-if="cart.length === 0" class="py-20 text-center">
              <div class="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
                <i class="ph ph-shopping-bag text-2xl"></i>
              </div>
              <p class="text-sm font-semibold text-slate-500">El ticket está vacío</p>
              <p class="text-xs text-slate-400 mt-0.5">Haz clic en un producto para agregarlo</p>
            </div>

            <div
              v-for="item in cart"
              :key="item.id"
              class="flex items-center justify-between gap-3 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-black text-slate-900 truncate leading-snug">{{ item.nombre }}</p>
                <p class="text-xs text-slate-500 font-mono mt-1 font-medium">
                  {{ store.formatMoney(item.precio) }} c/u &bull;
                  <span class="font-extrabold text-emerald-700 text-sm ml-0.5">{{ store.formatMoney(item.precio * item.quantity) }}</span>
                </p>
              </div>

              <!-- Controles (- / +) y Botón Eliminar con Tacho más grandes y claros -->
              <div class="flex items-center gap-2.5 shrink-0">
                <div class="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-1.5 py-1 shadow-2xs">
                  <button
                    @click="updateQuantity(item, -1)"
                    class="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer text-sm"
                  >
                    <i class="ph-bold ph-minus"></i>
                  </button>
                  <span class="text-sm font-black text-slate-900 w-6 text-center font-mono">{{ item.quantity }}</span>
                  <button
                    @click="updateQuantity(item, 1)"
                    class="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer text-sm"
                  >
                    <i class="ph-bold ph-plus"></i>
                  </button>
                </div>

                <button
                  @click="removeFromCart(item.id)"
                  class="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer shadow-2xs text-base"
                  title="Eliminar producto"
                >
                  <i class="ph-bold ph-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección de Pago -->
        <div class="p-4 bg-slate-50/90 border-t border-slate-200/80 rounded-b-2xl space-y-4 shrink-0">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Método de Pago
            </label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="method in (['Efectivo', 'Yape', 'Plin', 'Transferencia'] as const)"
                :key="method"
                @click="paymentMethod = method"
                :class="[
                  'py-2.5 px-1 rounded-xl text-xs font-black border transition cursor-pointer text-center shadow-2xs',
                  paymentMethod === method
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                ]"
              >
                {{ method === 'Transferencia' ? 'Transf.' : method }}
              </button>
            </div>
          </div>

          <!-- Cálculo de Vuelto -->
          <div v-if="paymentMethod === 'Efectivo' && cart.length > 0" class="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5 shadow-2xs">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-slate-700">Efectivo recibido:</span>
              <div class="relative w-32">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  {{ store.currency }}
                </span>
                <input
                  v-model.number="cashReceived"
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="0.00"
                  class="w-full bg-slate-50 text-right text-slate-900 font-mono text-sm font-black pl-7 pr-3 py-2 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <!-- Botones rápidos de billetes -->
            <div class="flex items-center justify-end gap-1.5">
              <button
                @click="cashReceived = cartTotal"
                class="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Exacto
              </button>
              <button
                v-for="bill in [10, 20, 50]"
                :key="bill"
                @click="cashReceived = bill"
                class="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                {{ store.currency }}{{ bill }}
              </button>
            </div>

            <div v-if="cashReceived !== null && cashReceived >= cartTotal" class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-600 font-bold">Vuelto a entregar:</span>
              <span class="font-black font-mono text-emerald-600 text-base">
                {{ store.formatMoney(changeDue) }}
              </span>
            </div>
          </div>

          <!-- Total General Más Grande y Visible -->
          <div class="flex items-center justify-between pt-1 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span class="text-xs font-black uppercase tracking-wider text-slate-500">Total a Cobrar</span>
            <span class="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {{ store.formatMoney(cartTotal) }}
            </span>
          </div>

          <!-- Botón de Cobro Destacado -->
          <button
            @click="processSale"
            :disabled="cart.length === 0 || !store.cajaEstado.abierta"
            class="w-full py-4 px-4 rounded-xl font-black text-base bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
          >
            <i class="ph-bold ph-check-circle text-xl"></i>
            <span>Cobrar Venta</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
