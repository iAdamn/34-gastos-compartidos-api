// Ruta publica para comprobar que la API esta arriba.
export const runtime = "nodejs";

export function GET(): Response {
  return Response.json({ ok: true });
}
