import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
  password: z.string()
    .min(1, 'La contraseña es requerida'),
});

export const signupSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
  password: z.string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
    .min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const otpSchema = z.object({
  otp: z.string()
    .min(1, 'El código es requerido')
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
});

export const householdSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
});

export const inviteCodeSchema = z.object({
  code: z.string()
    .min(1, 'El código es requerido')
    .length(8, 'El código debe tener 8 caracteres')
    .regex(/^[A-Z0-9]+$/i, 'Código inválido'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type HouseholdInput = z.infer<typeof householdSchema>;
export type InviteCodeInput = z.infer<typeof inviteCodeSchema>;

export function getFieldErrors<T extends z.ZodType>(
  schema: T,
  data: unknown
): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  
  const errors: Record<string, string> = {};
  for (const error of result.error.errors) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  }
  return errors;
}