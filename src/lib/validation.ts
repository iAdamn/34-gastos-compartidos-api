import { z } from "zod";

import { isValidGroupCode, normalizeGroupCode } from "@/src/domain/groupCode";
import { isValidAmount } from "@/src/domain/money";

import { badRequest } from "./errors";

const uid = z.string().min(1).max(128);
const amount = z
  .number()
  .refine(isValidAmount, "Debe ser un entero en centavos, mayor que 0 y multiplo de 100");

// Revisa que una fecha YYYY-MM-DD exista de verdad. 2026-13-45 tiene la forma pero no existe.
function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Los id de grupos, gastos y pagos son UUID. Otro texto no puede existir en la base.
export function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}

// Fecha y hora en formato ISO, como 2026-11-14T12:00:00.000Z.
export function isIsoDateTime(value: string): boolean {
  return z.iso.datetime().safeParse(value).success;
}

export const registerSchema = z.object({
  email: z.email("Correo invalido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.email("Correo invalido"),
  password: z.string().min(1, "Falta la contrasena"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Falta el refreshToken"),
});

export const createGroupSchema = z.object({
  nombre: z.string().trim().min(1).max(40),
  mi_nombre: z.string().trim().min(1).max(30),
});

export const joinGroupSchema = z.object({
  codigo: z
    .string()
    .transform(normalizeGroupCode)
    .refine(isValidGroupCode, "El codigo debe tener 6 caracteres validos"),
  mi_nombre: z.string().trim().min(1).max(30),
});

export const expenseSchema = z.object({
  id: z.uuid(),
  pagador_uid: uid,
  descripcion: z.string().trim().min(1).max(80),
  monto_centavos: amount,
  participantes: z.array(uid).min(1).max(20),
  porcentajes: z.record(z.string(), z.number().int().min(1)).nullable(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe ser YYYY-MM-DD")
    .refine(isRealDate, "Esa fecha no existe"),
});

export const paymentSchema = z.object({
  id: z.uuid(),
  de_uid: uid,
  a_uid: uid,
  monto_centavos: amount,
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;

// Valida un valor con un esquema. Zod descarta solo los campos que no estan declarados.
export function parseWith<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const detalles = result.error.issues.map((issue) => ({
      campo: issue.path.join("."),
      mensaje: issue.message,
    }));
    throw badRequest("Datos invalidos", detalles);
  }
  return result.data;
}

// Lee el cuerpo JSON de la peticion y lo valida.
export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("El cuerpo debe ser JSON valido");
  }
  return parseWith(schema, body);
}
