import api from '@/lib/axios'
import type { AuthLoginForm, AuthLoginResponseData, AuthProfileResponse } from '@/types'

export class AuthApi {
  static login = (formData: AuthLoginForm) =>
    api.post<AuthLoginResponseData>(`/auth/login`, formData)

  static profile = () => api.get<AuthProfileResponse>(`/auth/profile`)
}
