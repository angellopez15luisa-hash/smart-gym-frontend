import { z } from 'zod'

const userSchema = z.object({
  id: z.number(),
  username: z.string().trim().min(1, 'El usuario es obligatorio'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string(),
  role: z.string(),
  isActive: z.boolean(),
})

export const authSchema = userSchema.pick({
  id: true,
  username: true,
  role: true,
  name: true,
})

export const authLoginSchema = userSchema.pick({
  username: true,
  password: true,
})

export const authLoginResponseDataSchema = z.object({
  token: z.string(),
  user: userSchema.pick({
    id: true,
    username: true,
    name: true,
    role: true,
  }),
})

export const authProfileResponseSchema = authSchema
