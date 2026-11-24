import api from '@/lib/axios'
import type {
  CreatePlanInput,
  CreatePlanResponse,
  MessageResponse,
  Plan,
  PlanResponse,
  PlansListResponse,
  UpdatePlanInput,
  UpdatePlanResponse,
} from '@/types'


export class PlanApi {
  static findAll = () => api.get<PlansListResponse>(`/plans`)

  static findOne = (id: Plan['id']) => api.get<PlanResponse>(`/plans/${id}`)

  static create = (formData: CreatePlanInput) => api.post<CreatePlanResponse>(`/plans`, formData)

  static update = (id: Plan['id'], formData: UpdatePlanInput) =>
    api.patch<UpdatePlanResponse>(`/plans/${id}`, formData)

  static remove = (id: Plan['id']) => api.delete<MessageResponse>(`/plans/${id}`)
}
