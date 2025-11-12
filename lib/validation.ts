import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  handicapIndex: z.number().optional().nullable(),
  rounds: z.number().int().nonnegative().optional(),
})

export const updateUserSchema = userSchema.partial()

export type UserInput = z.infer<typeof userSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
