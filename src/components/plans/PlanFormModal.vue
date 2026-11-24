<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { configure, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { PlanAction } from '@/business/actions/plan.action'
import type { Plan, CreatePlanInput, UpdatePlanInput } from '@/types'
import { createPlanInputValue } from '@/values'
import { createPlanSchema, updatePlanSchema } from '@/schemas/plan.schema'

configure({
  validateOnBlur: false,
})

const props = defineProps<{
  modelValue: boolean
  plan?: Plan | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [plan: Plan]
}>()

const queryClient = useQueryClient()
const isEditing = computed(() => Boolean(props.plan))
const nameInputRef = ref<HTMLInputElement | null>(null)

const validationSchema = computed(() =>
  toTypedSchema(isEditing.value ? updatePlanSchema : createPlanSchema),
)

const { handleSubmit, resetForm, errors, defineField } = useForm<
  CreatePlanInput | UpdatePlanInput
>({
  validationSchema,
  initialValues: { ...createPlanInputValue },
})

const [name, nameProps] = defineField('name')
const [durationDays, durationDaysProps] = defineField('durationDays')
const [price, priceProps] = defineField('price')
const [description, descriptionProps] = defineField('description')
const [isActive, isActiveProps] = defineField('isActive')

function finishAndClose(savedPlan: Plan) {
  queryClient.invalidateQueries({ queryKey: ['plans'] })
  emit('saved', savedPlan)
  emit('update:modelValue', false)
}

const createMutation = useMutation({
  mutationFn: (formData: CreatePlanInput) => PlanAction.create(formData),
  onSuccess: (savedPlan) => {
    finishAndClose(savedPlan)
  },
})

const updateMutation = useMutation({
  mutationFn: ({ id, formData }: { id: Plan['id']; formData: UpdatePlanInput }) =>
    PlanAction.update({ id, formData }),
  onSuccess: (savedPlan) => {
    finishAndClose(savedPlan)
  },
})

const isPending = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value,
)

const isError = computed(
  () => createMutation.isError.value || updateMutation.isError.value,
)

const errorMessage = computed(() => {
  const err = (updateMutation.error.value || createMutation.error.value) as Error | null
  return err?.message || 'No se pudo guardar el plan.'
})

watch(
  () => [props.modelValue, props.plan] as const,
  async ([isOpen, plan]) => {
    if (!isOpen) return

    createMutation.reset()
    updateMutation.reset()

    if (plan) {
      resetForm({
        values: {
          name: plan.name,
          durationDays: plan.durationDays,
          price: Number(plan.price),
          description: plan.description ?? '',
          isActive: plan.isActive,
        },
      })
    } else {
      resetForm({
        values: {
          ...createPlanInputValue,
          name: '',
          durationDays: '' as unknown as number,
          price: '' as unknown as number,
          description: '',
          isActive: true,
        },
      })
    }

    await nextTick()
    nameInputRef.value?.focus()
  },
  { immediate: true },
)

function closeModal() {
  if (isPending.value) return
  emit('update:modelValue', false)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue && !isPending.value) {
    closeModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const onSubmit = handleSubmit((values) => {
  const trimmedDesc = values.description?.trim()
  const payload = {
    ...values,
    name: values.name?.trim(),
    description: trimmedDesc ? trimmedDesc : undefined,
  }

  if (props.plan) {
    updateMutation.mutate({
      id: props.plan.id,
      formData: payload as UpdatePlanInput,
    })
    return
  }

  createMutation.mutate(payload as CreatePlanInput)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div
        class="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        @click.stop
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-900">
            {{ isEditing ? 'Editar Plan' : 'Crear Nuevo Plan' }}
          </h3>
          <button
            type="button"
            :disabled="isPending"
            @click="closeModal"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
            title="Cerrar"
          >
            <i class="ph-bold ph-x text-base"></i>
          </button>
        </div>

        <form @submit.prevent="onSubmit" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
              Nombre del Plan *
            </label>
            <input
              ref="nameInputRef"
              v-model="name"
              v-bind="nameProps"
              type="text"
              placeholder="Ej. Mensualidad General"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
            <p v-if="errors.name" class="text-xs text-rose-600 mt-1">
              {{ errors.name }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Duración (Días) *
              </label>
              <input
                v-model.number="durationDays"
                v-bind="durationDaysProps"
                type="number"
                placeholder="30"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
              <p v-if="errors.durationDays" class="text-xs text-rose-600 mt-1">
                {{ errors.durationDays }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Precio *
              </label>
              <input
                v-model.number="price"
                v-bind="priceProps"
                type="number"
                step="0.01"
                min="0"
                placeholder="80.00"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
              <p v-if="errors.price" class="text-xs text-rose-600 mt-1">
                {{ errors.price }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
              Descripción corta
            </label>
            <input
              v-model="description"
              v-bind="descriptionProps"
              type="text"
              placeholder="Ej. Acceso libre a máquinas y pesas"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
            <p v-if="errors.description" class="text-xs text-rose-600 mt-1">
              {{ errors.description }}
            </p>
          </div>

          <label class="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              v-model="isActive"
              v-bind="isActiveProps"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span class="text-sm font-medium text-slate-700">Plan activo</span>
          </label>

          <p
            v-if="isError"
            class="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl"
          >
            {{ errorMessage }}
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              :disabled="isPending"
              @click="closeModal"
              class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isPending"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 cursor-pointer"
            >
              {{ isPending ? 'Guardando...' : 'Guardar Plan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Quitar flechas en inputs type="number" (Chrome, Safari, Edge, Opera) */
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Quitar flechas en Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}
</style>
 