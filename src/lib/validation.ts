/** Esquemas de validação compartilhados (cliente e servidor). */
import { z } from 'zod';
import { isValidDateStr } from './tz';

// WhatsApp BR: aceita (62) 99999-9999, 62 9 9999-9999, +55...
export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Informe o DDD + número.')
  .max(20)
  .refine((v) => v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 13, 'Número de telefone inválido.');

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55')) return `+${digits}`;
  return `+55${digits}`;
}

export const bookingPublicSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  phone: phoneSchema,
  serviceSlug: z.string().trim().min(1),
  itemCount: z.coerce.number().int().min(1, 'Informe a quantidade.').max(50),
  district: z.string().trim().min(2, 'Informe o bairro.').max(80),
  streetAddress: z.string().trim().min(3, 'Informe o endereço.').max(200),
  city: z.string().trim().max(80).optional(),
  addressRef: z.string().trim().max(200).optional().or(z.literal('')),
  preferredDate: z.string().refine(isValidDateStr, 'Data inválida.'),
  timeSlot: z.string().trim().max(40),
  period: z.enum(['MANHA', 'TARDE', 'NOITE']).optional().nullable(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  privacyAccepted: z.literal(true, { message: 'É necessário aceitar o aviso de privacidade.' }),
  photos: z.array(z.string().max(300)).max(6).optional(),
});

export type BookingPublicInput = z.infer<typeof bookingPublicSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido.').max(160),
  password: z.string().min(1, 'Informe a senha.').max(200),
});

export const setupSchema = z.object({
  setupToken: z.string().min(1, 'Informe o token de configuração.'),
  name: z.string().trim().min(3, 'Informe o nome.').max(120),
  email: z.string().trim().email('E-mail inválido.').max(160),
  password: z.string().min(10, 'A senha deve ter ao menos 10 caracteres.').max(200)
    .regex(/[A-Za-zçÇ]/, 'A senha deve conter letras.')
    .regex(/[0-9]/, 'A senha deve conter números.'),
});

export const customerSchema = z.object({
  name: z.string().trim().min(3).max(120),
  phone: phoneSchema,
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal('')),
  addressStreet: z.string().trim().max(200).optional().nullable().or(z.literal('')),
  addressDistrict: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  addressCity: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  addressState: z.string().trim().max(2).optional().nullable().or(z.literal('')),
  addressZip: z.string().trim().max(12).optional().nullable().or(z.literal('')),
  addressRef: z.string().trim().max(200).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  archived: z.boolean().optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contactName: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal('')),
  products: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  archived: z.boolean().optional(),
});

export const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().trim().min(2, 'Informe a descrição.').max(200),
  amountCents: z.coerce.number().int().min(1, 'Valor inválido.').max(100_000_000),
  dueDate: z.string().refine(isValidDateStr, 'Data de vencimento inválida.').optional().nullable(),
  customerId: z.string().max(40).optional().nullable(),
  supplierId: z.string().max(40).optional().nullable(),
  categoryId: z.string().max(40).optional().nullable(),
  accountId: z.string().max(40).optional().nullable(),
  paymentMethodId: z.string().max(40).optional().nullable(),
  installments: z.coerce.number().int().min(1).max(24).optional(),
  notes: z.string().trim().max(500).optional().nullable().or(z.literal('')),
});

export const paymentSchema = z.object({
  amountCents: z.coerce.number().int().min(1, 'Valor inválido.'),
  paidAt: z.string().optional(), // ISO ou vazio = agora
  methodId: z.string().max(40).optional().nullable(),
  accountId: z.string().max(40).optional().nullable(),
  note: z.string().trim().max(300).optional().nullable().or(z.literal('')),
});

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(['LIMPEZA', 'IMPERMEABILIZANTE', 'EPI', 'FERRAMENTA', 'OUTRO']),
  unit: z.enum(['ml', 'g', 'un']),
  displayUnit: z.string().max(10).optional().nullable(),
  minQuantity: z.coerce.number().int().min(0),
  costCents: z.coerce.number().int().min(0).max(100_000_000),
  purchaseUnitAmount: z.coerce.number().int().min(1).max(1_000_000).optional().nullable(),
  supplierId: z.string().max(40).optional().nullable(),
  expiryDate: z.string().refine(isValidDateStr, 'Data inválida.').optional().nullable(),
});

export const inventoryMovementSchema = z.object({
  type: z.enum(['ENTRADA', 'SAIDA', 'CONSUMO', 'AJUSTE']),
  quantity: z.coerce.number().int().min(1, 'Quantidade deve ser positiva.'),
  reason: z.string().trim().max(300).optional().nullable().or(z.literal('')),
  bookingId: z.string().max(40).optional().nullable(),
  // Para AJUSTE: signed indica direção; para ENTRADA é +, SAIDA/CONSUMO é -
  signed: z.enum(['+', '-']).optional(),
});

export const chatAskSchema = z.object({
  sessionId: z.string().trim().min(8).max(64),
  message: z.string().trim().min(1, 'Escreva sua pergunta.').max(500),
});

export const analyticsEventSchema = z.object({
  type: z.enum(['WHATSAPP_CLICK', 'BOOKING_SUBMIT', 'PHONE_CLICK', 'INSTAGRAM_CLICK', 'CHAT_OPEN', 'CHAT_WHATSAPP']),
  path: z.string().max(200).optional(),
  meta: z.string().max(200).optional(),
});

export const postSchema = z.object({
  title: z.string().trim().min(5, 'Título muito curto.').max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido (use minúsculas e hífens).').max(180),
  excerpt: z.string().trim().min(10).max(400),
  content: z.string().trim().min(50, 'Conteúdo muito curto.'),
  metaTitle: z.string().trim().max(70).optional().nullable().or(z.literal('')),
  metaDescription: z.string().trim().max(170).optional().nullable().or(z.literal('')),
  coverImage: z.string().trim().max(400).optional().nullable().or(z.literal('')),
  coverAlt: z.string().trim().max(300).optional().nullable().or(z.literal('')),
  authorName: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

export const serviceSchema = z.object({
  categoryId: z.string().min(1, 'Selecione a categoria.'),
  name: z.string().trim().min(3).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido.').max(140),
  description: z.string().trim().min(5).max(600),
  durationMin: z.coerce.number().int().min(30).max(600),
  whatsappMsg: z.string().trim().max(400).optional().nullable().or(z.literal('')),
  visibleOnSite: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const businessHoursSchema = z.object({
  rules: z.array(z.object({
    weekday: z.number().int().min(0).max(6),
    active: z.boolean(),
    openTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    slotMinutes: z.coerce.number().int().min(30).max(240),
    capacityPerSlot: z.coerce.number().int().min(1).max(10),
    breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  })).min(7).max(7),
});

export const blockingSchema = z.object({
  date: z.string().refine(isValidDateStr, 'Data inválida.'),
  timeSlot: z.string().trim().max(10).optional().nullable().or(z.literal('')),
  reason: z.string().trim().max(200).optional().nullable().or(z.literal('')),
});
