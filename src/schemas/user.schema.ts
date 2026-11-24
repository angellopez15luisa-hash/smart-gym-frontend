import { z } from 'zod'

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  role: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  currentPassword: z.string().min(1, '* La contraseña actual es obligatoria'),
  newPassword: z.string().min(8, '* La nueva contraseña debe tener al menos 8 caracteres'),
})

export const userLoginResponseSchema = userSchema.pick({
  id: true,
  username: true,
  role: true,
  name: true,
})

export const userUpdatePasswordFormSchema = userSchema
  .pick({
    currentPassword: true,
    newPassword: true,
  })
  .extend({
    confirmPassword: z.string().min(1, '* Confirma tu nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '* Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: '* La nueva contraseña no puede ser igual a la actual',
    path: ['newPassword'],
  })

// ==========================================
// Esquemas para el Listado de Usuarios (Kardex / Admin)
// ==========================================
export const userResponseSchema = userSchema.pick({
  id: true,
  name: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
})

export const usersListResponseSchema = z.array(userResponseSchema)


