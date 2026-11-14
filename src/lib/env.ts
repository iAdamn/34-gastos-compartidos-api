import { z } from "zod";

const envSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_WEB_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

// Revisa que esten todas las variables. Si falta una, falla con los nombres, nunca con los valores.
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Faltan variables de entorno: ${missing}`);
  }
  return {
    ...result.data,
    // En Vercel la clave privada se pega con \n escritos. Aqui se vuelven saltos de linea.
    FIREBASE_PRIVATE_KEY: result.data.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

export function getEnv(): Env {
  return parseEnv(process.env);
}
