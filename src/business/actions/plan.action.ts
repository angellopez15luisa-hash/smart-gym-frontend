import type { CreatePlanInput, Plan, UpdatePlanInput } from '@/types'
import { PlanService } from '../services'

export class PlanAction {
  static findAll = () => PlanService.findAll()

  static findOne = (id: Plan['id']) => PlanService.findOne(id)

  static create = (formData: CreatePlanInput) => PlanService.create(formData)

  static update = ({ id, formData }: { id: Plan['id'], formData: UpdatePlanInput }) => PlanService.update(id, formData)

  static remove = ( id:Plan['id'] ) => PlanService.remove(id)
}
