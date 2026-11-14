import { assertExpenseFitsGroup } from "@/src/lib/groupRules";
import { handle, json } from "@/src/lib/http";
import { requireMember } from "@/src/lib/membership";
import { expenseSchema, parseBody } from "@/src/lib/validation";
import { createExpense } from "@/src/repos/gastosRepo";

export const runtime = "nodejs";

type Context = { params: Promise<{ gid: string }> };

// Registra un gasto del grupo. Solo miembros.
export function POST(request: Request, context: Context): Promise<Response> {
  return handle(async () => {
    const { gid } = await context.params;
    const { user, group } = await requireMember(request, gid);
    const input = await parseBody(request, expenseSchema);
    assertExpenseFitsGroup(group, input);
    const { expense, created } = await createExpense(gid, user.uid, input);
    return json({ gasto: expense }, created ? 201 : 200);
  });
}
