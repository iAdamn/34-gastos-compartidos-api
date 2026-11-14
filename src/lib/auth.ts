import { unauthorized } from "./errors";
import { getAdminAuth } from "./firebase";

export type AuthUser = { uid: string; email: string };

// Saca el token de la cabecera "Authorization: Bearer <token>".
function readBearerToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw unauthorized();
  }
  return token;
}

// Verifica el ID token con Firebase Admin. El uid sale de aqui, nunca del cuerpo ni de la URL.
export async function requireUser(request: Request): Promise<AuthUser> {
  const token = readBearerToken(request);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? "" };
  } catch {
    throw unauthorized("Token invalido o vencido");
  }
}
