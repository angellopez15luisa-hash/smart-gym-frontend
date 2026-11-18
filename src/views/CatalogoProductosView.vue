<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGymStore } from '@/stores/useGymStore'
import type { Producto } from '@/types/gym.types'

const store = useGymStore()

const searchTerm = ref('')
const selectedCategory = ref('todos')

// Estado del Modal de Crear/Editar Producto
const isModalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref({
  nombre: '',
  categoria: 'Bebidas',
  precio: 0,
  costo: 0,
  stock: 0,
  stockMinimo: 5
})

// Categorías disponibles
const categories = ['Bebidas', 'Suplementos', 'Accesorios', 'General']

// Productos filtrados
const filteredProducts = computed(() => {
  return store.productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'todos' || p.categoria === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

function openCreateModal() {
  editingId.value = null
  form.value = { nombre: '', categoria: 'Bebidas', precio: 0, costo: 0, stock: 10, stockMinimo: 3 }
  isModalOpen.value = true
}

function openEditModal(prod: Producto) {
  editingId.value = prod.id
  form.value = {
    nombre: prod.nombre,
    categoria: prod.categoria || 'Bebidas',
    precio: prod.precio,
    costo: prod.costo || 0,
    stock: prod.stock,
    stockMinimo: prod.stockMinimo || 3
  }
  isModalOpen.value = true
}

function saveProduct() {
  if (!form.value.nombre.trim()) {
    store.notify('El nombre del producto es obligatorio', 'error')
    return
  }

  if (editingId.value) {
    // Editar existente asignando explícitamente para mantener el ID intacto
    const idx = store.productos.findIndex(p => p.id === editingId.value)
    if (idx !== -1) {
      const prodActual = store.productos[idx]
      if (prodActual) {
        prodActual.nombre = form.value.nombre
        prodActual.categoria = form.value.categoria
        prodActual.precio = form.value.precio
        prodActual.costo = form.value.costo
        prodActual.stock = form.value.stock
        prodActual.stockMinimo = form.value.stockMinimo
      }
      store.notify('Producto actualizado correctamente')
    }
  } else {
    // Crear nuevo producto tipado
    const newProd: Producto = {
      id: `prod-${Date.now()}`,
      nombre: form.value.nombre,
      categoria: form.value.categoria,
      precio: form.value.precio,
      costo: form.value.costo,
      stock: form.value.stock,
      stockMinimo: form.value.stockMinimo
    }
    store.productos.unshift(newProd)
    store.notify('Nuevo producto registrado en el catálogo')
  }

  isModalOpen.value = false
}

function deleteProduct(id: string) {
  if (confirm('¿Estás seguro de eliminar este producto del inventario?')) {
    store.productos = store.productos.filter(p => p.id !== id)
    store.notify('Producto eliminado', 'warning')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header de la sección -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <i class="ph-bold ph-package text-emerald-600"></i>
          Catálogo y Maestros de Productos
        </h1>
        <p class="text-sm text-slate-500">Administra precios, costos de compra, stock mínimo y categorías.</p>
      </div>

      <button
        @click="openCreateModal"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition shadow-sm cursor-pointer"
      >
        <i class="ph-bold ph-plus text-base"></i>
        <span>Nuevo Producto</span>
      </button>
    </div>

    <!-- Buscador y Filtros -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
      <div class="relative w-full sm:w-80">
        <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar producto..."
          class="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-500 text-sm"
        />
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        <button
          v-for="cat in ['todos', ...categories]"
          :key="cat"
          @click="selectedCategory = cat"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition cursor-pointer',
            selectedCategory === cat
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          ]"
        >
          {{ cat === 'todos' ? 'Todos' : cat }}
        </button>
      </div>
    </div>

    <!-- Tabla de Productos -->
    <div class="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th class="py-3 px-4">Producto</th>
              <th class="py-3 px-4">Categoría</th>
              <th class="py-3 px-4 text-right">Costo</th>
              <th class="py-3 px-4 text-right">Precio Venta</th>
              <th class="py-3 px-4 text-center">Stock Actual</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="py-12 text-center text-slate-400 text-sm">
                No se encontraron productos registrados.
              </td>
            </tr>

            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-slate-50/60 transition">
              <td class="py-3.5 px-4 font-bold text-slate-800">
                {{ product.nombre }}
              </td>
              <td class="py-3.5 px-4">
                <span class="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                  {{ product.categoria || 'General' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right font-mono text-slate-500">
                {{ store.formatMoney(product.costo || 0) }}
              </td>
              <td class="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                {{ store.formatMoney(product.precio) }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span
                  :class="[
                    'inline-block px-2.5 py-1 rounded-md text-xs font-bold',
                    product.stock <= 0
                      ? 'bg-rose-100 text-rose-700'
                      : product.stock <= (product.stockMinimo || 3)
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-700'
                  ]"
                >
                  {{ product.stock }} unids.
                </span>
              </td>
              <td class="py-3.5 px-4 text-right space-x-2">
                <button
                  @click="openEditModal(product)"
                  class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Editar"
                >
                  <i class="ph-bold ph-pencil text-sm"></i>
                </button>
                <button
                  @click="deleteProduct(product.id)"
                  class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                  title="Eliminar"
                >
                  <i class="ph-bold ph-trash text-sm"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Crear / Editar -->
[cite: 9]    <div v-if="isModalOpen" class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="font-extrabold text-slate-800 text-base">
            {{ editingId ? 'Editar Producto' : 'Nuevo Producto' }}
          </h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Nombre del Producto</label>
            <input
              v-model="form.nombre"
              type="text"
              placeholder="Ej. Creatina Monohidratada 300g"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Categoría</label>
              <select
                v-model="form.categoria"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Stock Inicial</label>
              <input
                v-model.number="form.stock"
                type="number"
                min="0"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Costo Compra (S/)</label>
              <input
                v-model.number="form.costo"
                type="number"
                step="0.50"
                min="0"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Precio Venta (S/)</label>
              <input
                v-model.number="form.precio"
                type="number"
                step="0.50"
                min="0"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-600"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            @click="isModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="saveProduct"
            class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm cursor-pointer"
          >
            Guardar Producto
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
