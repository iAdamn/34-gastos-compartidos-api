import { ApiError } from "./errors";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

// Convierte cualquier error en una respuesta con el formato { error, detalles? }.
export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    const body = error.detalles
      ? { error: error.message, detalles: error.detalles }
      : { error: error.message };
    return json(body, error.status);
  }
  // Error que no esperabamos. Se registra solo el mensaje, nunca tokens ni datos del usuario,
  // y al cliente no se le cuenta nada.
  const message = error instanceof Error ? error.message : "desconocido";
  // eslint-disable-next-line no-console -- unico log permitido: errores internos del servidor
  console.error("Error interno:", message);
  return json({ error: "Error interno" }, 500);
}

// Envuelve una ruta para que todos los errores salgan con el mismo formato.
export async function handle(action: () => Promise<Response>): Promise<Response> {
  try {
    return await action();
  } catch (error) {
    return errorResponse(error);
  }
}
