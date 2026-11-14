import { handle, json } from "@/src/lib/http";
import { requireMember } from "@/src/lib/membership";
import { deleteExpense } from "@/src/repos/gastosRepo";

export const runtime = "nodejs";

type Context = { params: Promise<{ gid: string; id: string }> };

// Elimina un gasto (borrado logico). Solo quien lo creo.
export function DELETE(request: Request, context: Context): Promise<Response> {
  return handle(async () => {
    const { gid, id } = await context.params;
    const { user } = await requireMember(request, gid);
    await deleteExpense(gid, id, user.uid);
    return json({ ok: true });
  });
}
