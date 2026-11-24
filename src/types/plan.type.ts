import { z } from 'zod'
import {
  createPlanSchema,
  planSchema,
  updatePlanSchema,
  planListResponseSchema,
  planResponseSchema,
  createPlanResponseSchema,
  updatePlanResponseSchema,
} from '@/schemas'

export type Plan = z.infer<typeof planSchema>
export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
export type PlanResponse = z.infer<typeof planResponseSchema>
export type PlansListResponse = z.infer<typeof planListResponseSchema>
export type CreatePlanResponse = z.infer<typeof createPlanResponseSchema>
export type UpdatePlanResponse = z.infer<typeof updatePlanResponseSchema>
