// Ayudas para armar peticiones en las pruebas.

type Options = { token?: string; body?: unknown; rawBody?: string };

// Crea una Request como la que recibiria una ruta. Con token agrega la cabecera Authorization.
export function makeRequest(method: string, path: string, options: Options = {}): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }
  const body =
    options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body));
  return new Request(`http://localhost${path}`, { method, headers, body });
}

// Next entrega los parametros de la URL como una promesa.
export function params<T>(values: T): { params: Promise<T> } {
  return { params: Promise.resolve(values) };
}

// Ids fijos para que las pruebas sean faciles de leer.
export const EXPENSE_ID = "11111111-1111-4111-8111-111111111111";
export const OTHER_EXPENSE_ID = "22222222-2222-4222-8222-222222222222";
export const PAYMENT_ID = "33333333-3333-4333-8333-333333333333";
