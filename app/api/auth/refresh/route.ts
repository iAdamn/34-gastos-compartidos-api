import { handle, json } from "@/src/lib/http";
import { parseBody, refreshSchema } from "@/src/lib/validation";
import { refreshSession } from "@/src/services/firebaseAuthRest";

export const runtime = "nodejs";

// Cambia un refreshToken por un ID token nuevo (el ID token dura 1 hora).
export function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { refreshToken } = await parseBody(request, refreshSchema);
    const tokens = await refreshSession(refreshToken);
    return json(tokens);
  });
}
