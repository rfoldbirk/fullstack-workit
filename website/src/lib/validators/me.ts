import { z } from 'zod';

export const updateProfileSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(2, 'Name must be at least 2 characters')
			.max(30, 'Name must be 30 characters or less')
			.optional(),
		weightKg: z.number().positive().max(500).optional(),
		heightCm: z.number().positive().max(300).optional(),
		dateOfBirth: z.coerce.date().optional(),
		gender: z.enum(['male', 'female']).optional(),
		picture: z.url().max(120).optional(),
	})
	.refine((data) => Object.values(data).some((value) => value !== undefined), {
		message: 'Change at least one field',
	});

export const logWeightSchema = z.object({
	weight: z.number().positive('Weight must be positive').max(500),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LogWeightInput = z.infer<typeof logWeightSchema>;
