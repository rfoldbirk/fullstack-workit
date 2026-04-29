import { z } from 'zod';

export const EQUIPMENT_VALUES = [
	'None',
	'Barbell',
	'Dumbbell',
	'Kettlebell',
	'Machine',
	'Plate',
	'Resistance_Band',
	'Suspension_Band',
	'Other',
] as const;

export type Equipment = (typeof EQUIPMENT_VALUES)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
	None: 'None',
	Barbell: 'Barbell',
	Dumbbell: 'Dumbbell',
	Kettlebell: 'Kettlebell',
	Machine: 'Machine',
	Plate: 'Plate',
	Resistance_Band: 'Resistance Band',
	Suspension_Band: 'Suspension Band',
	Other: 'Other',
};

export const createExerciseSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(30, 'Name is too long'),
	description: z
		.string()
		.trim()
		.min(1, 'Description is required')
		.max(120, 'Description is too long'),
	equipment: z.enum(EQUIPMENT_VALUES),
	muscleGroupIds: z
		.array(z.number().int().positive())
		.min(1, 'Pick at least one muscle group')
		.max(5, 'At most five muscle groups'),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
