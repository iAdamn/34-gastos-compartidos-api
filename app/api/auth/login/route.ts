import { handle, json } from "@/src/lib/http";
import { loginSchema, parseBody } from "@/src/lib/validation";
import { signIn } from "@/src/services/firebaseAuthRest";

export const runtime = "nodejs";

// Inicia sesion con correo y contrasena y devuelve los tokens.
export function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { email, password } = await parseBody(request, loginSchema);
    const session = await signIn(email, password);
    return json(session);
  });
}
