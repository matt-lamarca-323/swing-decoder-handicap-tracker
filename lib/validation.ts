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

export const roundSchema = z.object({
  userId: z.number().int().positive('User ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  datePlayed: z.string().datetime('Invalid date format').or(z.date()),
  score: z.number().int().positive('Score must be a positive number'),
  holes: z.number().int().refine((val) => val === 9 || val === 18, {
    message: 'Holes must be either 9 or 18',
  }).optional(),
  courseRating: z.number().positive().optional().nullable(),
  slopeRating: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  // Golf statistics
  greensInRegulation: z.number().int().min(0).max(18).optional().nullable(),
  fairwaysInRegulation: z.number().int().min(0).max(14).optional().nullable(),
  putts: z.number().int().min(0).optional().nullable(),
  upAndDowns: z.number().int().min(0).optional().nullable(),
  upAndDownAttempts: z.number().int().min(0).optional().nullable(),
})

export const updateRoundSchema = roundSchema.partial()

export type RoundInput = z.infer<typeof roundSchema>
export type UpdateRoundInput = z.infer<typeof updateRoundSchema>
