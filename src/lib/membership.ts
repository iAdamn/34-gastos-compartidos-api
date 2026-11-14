import { findGroup } from "@/src/repos/gruposRepo";

import { requireUser, type AuthUser } from "./auth";
import { forbidden, notFound } from "./errors";
import type { Group } from "./types";

// Lo usan todas las rutas de un grupo: verifica el token y que el usuario sea miembro.
// 401 sin token valido, 404 si el grupo no existe y 403 si no es miembro.
export async function requireMember(
  request: Request,
  gid: string,
): Promise<{ user: AuthUser; group: Group }> {
  const user = await requireUser(request);
  const group = await findGroup(gid);
  if (!group) {
    throw notFound("Grupo no encontrado");
  }
  if (!group.miembros.includes(user.uid)) {
    throw forbidden();
  }
  return { user, group };
}
