import { requireUser } from "@/src/lib/auth";
import { handle, json } from "@/src/lib/http";
import { createGroupSchema, parseBody } from "@/src/lib/validation";
import { createGroup, listGroupsOf } from "@/src/repos/gruposRepo";

export const runtime = "nodejs";

// Crea un grupo. Quien lo crea queda como primer miembro.
export function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await requireUser(request);
    const input = await parseBody(request, createGroupSchema);
    const grupo = await createGroup(user.uid, input.nombre, input.mi_nombre);
    return json({ grupo }, 201);
  });
}

// Mis grupos: solo los grupos donde el usuario del token es miembro.
export function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await requireUser(request);
    const items = await listGroupsOf(user.uid);
    return json({ items });
  });
}
