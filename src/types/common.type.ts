import type { messageResponseSchema } from "@/schemas"
import type z from 'zod'

export type MessageResponse = z.infer<typeof messageResponseSchema>
