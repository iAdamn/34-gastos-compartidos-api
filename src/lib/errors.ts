// Detalle de un campo que no paso la validacion.
export type ErrorDetail = { campo: string; mensaje: string };

// Error que la API le puede mostrar al cliente: lleva el codigo HTTP y un mensaje seguro.
// Cualquier otro error se responde como 500 Error interno, sin detalles.
export class ApiError extends Error {
  readonly status: number;
  readonly detalles?: ErrorDetail[];

  constructor(status: number, message: string, detalles?: ErrorDetail[]) {
    super(message);
    this.status = status;
    this.detalles = detalles;
  }
}

export function badRequest(message: string, detalles?: ErrorDetail[]): ApiError {
  return new ApiError(400, message, detalles);
}

export function unauthorized(message = "No autenticado"): ApiError {
  return new ApiError(401, message);
}

export function forbidden(message = "No tienes acceso a este grupo"): ApiError {
  return new ApiError(403, message);
}

export function notFound(message = "No encontrado"): ApiError {
  return new ApiError(404, message);
}

export function conflict(message: string): ApiError {
  return new ApiError(409, message);
}
