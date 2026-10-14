import { z } from 'zod';

export const idSchema = z.string().min(1);

export const reorderSchema = z.object({
  ids: z.array(idSchema).min(1),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

/** Campo de texto opcional: string vazia vira `null`. */
export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));
