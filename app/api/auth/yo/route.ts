import { requireUser } from "@/src/lib/auth";
import { handle, json } from "@/src/lib/http";

export const runtime = "nodejs";

// Devuelve el usuario dueno del token.
export function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await requireUser(request);
    return json({ usuario: { id: user.uid, email: user.email } });
  });
}
