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
import { isAxiosError } from 'axios'
import { PlanApi } from '../apis'
import {
  createPlanResponseSchema,
  messageResponseSchema,
  planListResponseSchema,
  planResponseSchema,
  updatePlanResponseSchema,
} from '@/schemas'

export class PlanService {
  static findAll = async (): Promise<PlansListResponse> => {
    try {
      const { data } = await PlanApi.findAll()
      const response = planListResponseSchema.safeParse(data)
      if (!response.success) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  }

  static findOne = async (id: Plan['id']): Promise<PlanResponse> => {
    try {
      const { data } = await PlanApi.findOne(id)
      const response = planResponseSchema.safeParse(data)
      if (!response.success) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  }

  static create = async (formData: CreatePlanInput): Promise<CreatePlanResponse> => {
    try {
      const { data } = await PlanApi.create(formData)
      const response = createPlanResponseSchema.safeParse(data)
      if (!response.success) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  }

  static update = async (
    id: Plan['id'],
    formData: UpdatePlanInput,
  ): Promise<UpdatePlanResponse> => {
    try {
      const { data } = await PlanApi.update(id, formData)
      const response = updatePlanResponseSchema.safeParse(data)
      if (!response.success) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  }

  static remove = async (id: Plan['id']): Promise<MessageResponse> => {
    try {
      const { data } = await PlanApi.remove(id)
      const response = messageResponseSchema.safeParse(data)
      if (!response.success) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  }
}
