import { handle, json } from "@/src/lib/http";
import { parseBody, registerSchema } from "@/src/lib/validation";
import { signUp } from "@/src/services/firebaseAuthRest";

export const runtime = "nodejs";

// Crea la cuenta con correo y contrasena y devuelve los tokens de sesion.
export function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { email, password } = await parseBody(request, registerSchema);
    const session = await signUp(email, password);
    return json(session, 201);
  });
}
