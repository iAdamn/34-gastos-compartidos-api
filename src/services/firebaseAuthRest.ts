import { ApiError, badRequest, conflict, unauthorized } from "@/src/lib/errors";
import { getEnv } from "@/src/lib/env";

// La API inicia sesion por el usuario llamando a la API REST de Firebase Auth.
// La clave web vive solo en el servidor. La app nunca la ve.
const ACCOUNTS_URL = "https://identitytoolkit.googleapis.com/v1/accounts";
const TOKEN_URL = "https://securetoken.googleapis.com/v1/token";

// El mismo mensaje exista o no el correo, para no revelar quien tiene cuenta.
const INVALID_CREDENTIALS = "Correo o contrasena incorrectos";

export type Session = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: { id: string; email: string };
};

export type RefreshedTokens = { token: string; refreshToken: string; expiraEnSeg: number };

// Traduce el codigo de error de Firebase al error que ve el cliente.
function toApiError(firebaseMessage: string): Error {
  const code = firebaseMessage.split(" ")[0] ?? "";
  if (code === "EMAIL_EXISTS") {
    return conflict("El correo ya esta registrado");
  }
  if (code === "WEAK_PASSWORD" || code === "INVALID_EMAIL") {
    return badRequest("Correo o contrasena no validos");
  }
  if (["EMAIL_NOT_FOUND", "INVALID_PASSWORD", "INVALID_LOGIN_CREDENTIALS"].includes(code)) {
    return unauthorized(INVALID_CREDENTIALS);
  }
  if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") {
    return new ApiError(429, "Demasiados intentos. Intenta mas tarde");
  }
  if (
    ["INVALID_REFRESH_TOKEN", "TOKEN_EXPIRED", "USER_NOT_FOUND", "USER_DISABLED"].includes(code)
  ) {
    return unauthorized("La sesion ya no es valida");
  }
  return new Error(`Firebase Auth respondio ${code}`);
}

// Hace el POST a Firebase y devuelve el JSON, o lanza el error traducido.
async function postToFirebase(
  url: string,
  contentType: string,
  body: string,
): Promise<Record<string, unknown>> {
  const key = getEnv().FIREBASE_WEB_API_KEY;
  const response = await fetch(`${url}?key=${key}`, {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
  const data: { error?: { message?: string } } & Record<string, unknown> = await response.json();
  if (!response.ok) {
    throw toApiError(data.error?.message ?? "");
  }
  return data;
}

// Las rutas de cuentas reciben el cuerpo como JSON.
function postAccount(action: string, email: string, password: string) {
  const body = JSON.stringify({ email, password, returnSecureToken: true });
  return postToFirebase(`${ACCOUNTS_URL}:${action}`, "application/json", body);
}

function toSession(data: Record<string, unknown>): Session {
  return {
    token: String(data.idToken),
    refreshToken: String(data.refreshToken),
    expiraEnSeg: Number(data.expiresIn),
    usuario: { id: String(data.localId), email: String(data.email) },
  };
}

export async function signUp(email: string, password: string): Promise<Session> {
  return toSession(await postAccount("signUp", email, password));
}

export async function signIn(email: string, password: string): Promise<Session> {
  return toSession(await postAccount("signInWithPassword", email, password));
}

// La ruta de tokens de Google recibe el cuerpo como formulario, no como JSON.
export async function refreshSession(refreshToken: string): Promise<RefreshedTokens> {
  const form = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
  const data = await postToFirebase(
    TOKEN_URL,
    "application/x-www-form-urlencoded",
    form.toString(),
  );
  return {
    token: String(data.id_token),
    refreshToken: String(data.refresh_token),
    expiraEnSeg: Number(data.expires_in),
  };
}
