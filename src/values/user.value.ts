import type { UserAuth, UserUpdatePasswordForm } from '@/types'

export const userAuthValue: UserAuth = {
  id: 0,
  username: '',
  role: '',
  name: ""
}

export const userUpdatePasswordValue: UserUpdatePasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}
