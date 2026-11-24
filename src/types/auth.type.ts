import type {
  authLoginResponseDataSchema,
  authLoginSchema,
  authProfileResponseSchema,
  authSchema,
} from '@/schemas'
import { z } from 'zod'

export type Auth = z.infer<typeof authSchema>

export type AuthLoginForm = z.infer<typeof authLoginSchema>

export type AuthLoginResponseData = z.infer<typeof authLoginResponseDataSchema>

export type AuthProfileResponse = z.infer<typeof authProfileResponseSchema>
