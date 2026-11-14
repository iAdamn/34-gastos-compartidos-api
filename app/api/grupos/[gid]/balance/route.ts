import { computeBalances } from "@/src/domain/balance";
import { suggestPayments } from "@/src/domain/settle";
import { handle, json } from "@/src/lib/http";
import { requireMember } from "@/src/lib/membership";
import { listActiveExpenses } from "@/src/repos/gastosRepo";
import { listPayments } from "@/src/repos/pagosRepo";

export const runtime = "nodejs";

type Context = { params: Promise<{ gid: string }> };

// El servidor calcula el saldo de cada miembro y los pagos sugeridos para saldar.
export function GET(request: Request, context: Context): Promise<Response> {
  return handle(async () => {
    const { gid } = await context.params;
    const { group } = await requireMember(request, gid);
    const expenses = await listActiveExpenses(gid);
    const payments = await listPayments(gid);
    const saldos = computeBalances(group.miembros, expenses, payments);
    const balances = [...group.miembros].sort().map((uid) => ({
      uid,
      nombre: group.miembros_info[uid]?.nombre ?? "",
      saldo_centavos: saldos[uid] ?? 0,
    }));
    return json({
      balances,
      pagos_sugeridos: suggestPayments(saldos),
      servidor_ahora: new Date().toISOString(),
    });
  });
}
