import { assertPaymentFitsGroup } from "@/src/lib/groupRules";
import { handle, json } from "@/src/lib/http";
import { requireMember } from "@/src/lib/membership";
import { parseBody, paymentSchema } from "@/src/lib/validation";
import { createPayment } from "@/src/repos/pagosRepo";

export const runtime = "nodejs";

type Context = { params: Promise<{ gid: string }> };

// Registra un pago entre dos miembros del grupo (liquidacion).
export function POST(request: Request, context: Context): Promise<Response> {
  return handle(async () => {
    const { gid } = await context.params;
    const { user, group } = await requireMember(request, gid);
    const input = await parseBody(request, paymentSchema);
    assertPaymentFitsGroup(group, input);
    const { payment, created } = await createPayment(gid, user.uid, input);
    return json({ pago: payment }, created ? 201 : 200);
  });
}
