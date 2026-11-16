import { badRequest } from "@/src/lib/errors";
import { handle, json } from "@/src/lib/http";
import { requireMember } from "@/src/lib/membership";
import { isIsoDateTime } from "@/src/lib/validation";
import { listChangedExpenses } from "@/src/repos/gastosRepo";
import { listChangedPayments } from "@/src/repos/pagosRepo";

export const runtime = "nodejs";

type Context = { params: Promise<{ gid: string }> };

// Lee el parametro since de la URL. Debe ser una fecha ISO, o no venir.
// Se devuelve normalizada, porque Firestore compara las fechas como texto.
function readSince(request: Request): string | null {
  const since = new URL(request.url).searchParams.get("since");
  if (since === null) {
    return null;
  }
  if (!isIsoDateTime(since)) {
    throw badRequest("Datos invalidos", [{ campo: "since", mensaje: "Debe ser una fecha ISO" }]);
  }
  return new Date(since).toISOString();
}

// Sincronizacion por grupo: gastos y pagos modificados despues de since.
export function GET(request: Request, context: Context): Promise<Response> {
  return handle(async () => {
    const { gid } = await context.params;
    const { group } = await requireMember(request, gid);
    const since = readSince(request);
    // La hora se toma antes de consultar, para que la app no se pierda cambios hechos mientras tanto.
    const servidorAhora = new Date().toISOString();
    const gastos = await listChangedExpenses(gid, since);
    const pagos = await listChangedPayments(gid, since);
    return json({ grupo: group, gastos, pagos, servidor_ahora: servidorAhora });
  });
}
