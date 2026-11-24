import type { CreatePlanInput } from '@/types'

export const createPlanInputValue: CreatePlanInput = {
  name: '',
  durationDays: '' as unknown as number,
  price: 0,
  isActive: false,
}
