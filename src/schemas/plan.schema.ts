import { z } from 'zod'

const optionalNumberField = (requiredMsg: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number({ error: requiredMsg }),
  )

const planUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  role: z.string(),
})

export const planSchema = z.object({
  id: z.number(),
  name: z.string().trim().min(1, '* El nombre del plan es obligatorio'),
  description: z.string().nullable().optional(),
  durationDays: optionalNumberField('* La duración es obligatoria').pipe(
    z
      .number({ error: '* La duración debe ser un número' })
      .int('* La duración debe ser un número entero')
      .min(1, '* La duración mínima es de 1 día'),
  ),
  price: z
    .number({ error: '* El precio debe ser un número' })
    .min(0, '* El precio no puede ser negativo'),
  isActive: z.boolean(),
  userId: z.number(),
  user: planUserSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createPlanSchema = planSchema.pick({
  name: true,
  durationDays: true,
  price: true,
  description: true,
  isActive: true,
})

export const createPlanResponseSchema = planSchema.omit({
  user: true,
})

export const updatePlanResponseSchema = planSchema

export const updatePlanSchema = createPlanSchema.partial()

export const planResponseSchema = planSchema

export const planListResponseSchema = z.array(planSchema)
