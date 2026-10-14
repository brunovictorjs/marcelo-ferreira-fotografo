import { z } from 'zod';
import { USER_ROLES } from '../constants.js';

const password = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(128);

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.').trim().toLowerCase(),
  password: z.string().min(1, 'Informe sua senha.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const inviteUserSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome.').max(120),
  email: z.email('Informe um e-mail válido.').trim().toLowerCase(),
  role: z.enum(USER_ROLES),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  password,
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email('Informe um e-mail válido.').trim().toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = acceptInviteSchema;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changeUserRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
