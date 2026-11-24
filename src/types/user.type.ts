import type {
  userSchema,
  userUpdatePasswordFormSchema,
  userResponseSchema,
  usersListResponseSchema
} from '@/schemas'
import { z } from 'zod'

export type User = z.infer<typeof userSchema>

export type UserAuth = Pick<User, 'id' | 'username' | 'role' | 'name'>

export type UserUpdatePasswordForm = z.infer<typeof userUpdatePasswordFormSchema>

export type UserUpdatePasswordNotConfirmForm = Omit<UserUpdatePasswordForm, 'confirmPassword'>

export type UserResponse = z.infer<typeof userResponseSchema>

export type UsersListResponse = z.infer<typeof usersListResponseSchema>
