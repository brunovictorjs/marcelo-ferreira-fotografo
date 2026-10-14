import { z } from 'zod';
import { MESSAGE_FILTERS } from '../constants.js';
import { optionalText } from './common.js';

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120),
  email: z.email('Informe um e-mail válido.').trim().toLowerCase(),
  phone: optionalText(40),
  workType: z.string().trim().min(1, 'Escolha o tipo de trabalho.').max(80),
  desiredDate: optionalText(40),
  message: z.string().trim().min(10, 'Conte um pouco mais (mínimo 10 caracteres).').max(4000),
  /** Honeypot anti-spam: precisa chegar vazio. */
  website: z.string().max(0).optional(),
});
export type ContactMessageInput = z.input<typeof contactMessageSchema>;

export const listMessagesQuerySchema = z.object({
  filter: z.enum(MESSAGE_FILTERS).default('all'),
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
