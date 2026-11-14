import { badRequest } from "@/src/lib/errors";
import { handle, json } from "@/src/lib/http";
import { requireMember } from "@/src/lib/membership";
import { listChangedExpenses } from "@/src/repos/gastosRepo";
import { listChangedPayments } from "@/src/repos/pagosRepo";

export const runtime = "nodejs";

type Context = { params: Promise<{ gid: string }> };

// Lee el parametro since de la URL. Debe ser una fecha, o no venir.
function readSince(request: Request): string | null {
  const since = new URL(request.url).searchParams.get("since");
  if (since !== null && Number.isNaN(Date.parse(since))) {
    throw badRequest("Datos invalidos", [{ campo: "since", mensaje: "Debe ser una fecha ISO" }]);
  }
  return since;
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
