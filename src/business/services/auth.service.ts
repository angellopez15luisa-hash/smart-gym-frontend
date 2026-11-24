import type { AuthLoginForm, AuthLoginResponseData, AuthProfileResponse } from '@/types'
import { isAxiosError } from 'axios'
import { AuthApi } from '../apis'
import { authLoginResponseDataSchema, authProfileResponseSchema } from '@/schemas'

export class AuthService {
  static login = async (formData: AuthLoginForm): Promise<AuthLoginResponseData> => {
    try {
      const { data } = await AuthApi.login(formData)
      const response = authLoginResponseDataSchema.safeParse(data)
      if (!response.success) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }
      localStorage.setItem(import.meta.env.VITE_TOKEN, response.data.token)
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  }

  static profile = async (): Promise<AuthProfileResponse> => {
    try {
      const { data } = await AuthApi.profile()
      const response = authProfileResponseSchema.safeParse(data)
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
