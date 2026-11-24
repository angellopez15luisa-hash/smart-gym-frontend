import type { AuthLoginForm } from '@/types'
import { AuthService } from '../services'

export class AuthAction {
  static login = (formData: AuthLoginForm) => AuthService.login(formData)

  static profile = () => AuthService.profile()
}
