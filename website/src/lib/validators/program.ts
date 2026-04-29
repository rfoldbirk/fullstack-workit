import { z } from 'zod';

export const createProgramSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
	description: z
		.string()
		.trim()
		.min(1, 'Description is required')
		.max(500, 'Description is too long'),
});

export const addExerciseSchema = z.object({
	exerciseId: z.number().int().positive('Pick an exercise'),
});

export const logSetSchema = z.object({
	reps: z.number().int().positive('Reps must be a positive whole number').max(1000),
	kg: z.number().nonnegative('Weight must be zero or positive').max(1000),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type AddExerciseInput = z.infer<typeof addExerciseSchema>;
export type LogSetInput = z.infer<typeof logSetSchema>;
