import { requireUser } from "@/src/lib/auth";
import { handle, json } from "@/src/lib/http";
import { joinGroupSchema, parseBody } from "@/src/lib/validation";
import { joinGroupByCode } from "@/src/repos/gruposRepo";

export const runtime = "nodejs";

// Une al usuario del token al grupo que tiene ese codigo.
export function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await requireUser(request);
    const input = await parseBody(request, joinGroupSchema);
    const grupo = await joinGroupByCode(user.uid, input.codigo, input.mi_nombre);
    return json({ grupo });
  });
}
