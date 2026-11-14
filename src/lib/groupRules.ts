import { splitByPercent, splitEqually } from "@/src/domain/split";

import { badRequest } from "./errors";
import type { Group } from "./types";
import type { ExpenseInput, PaymentInput } from "./validation";

// Reglas que dependen del grupo y que Zod no puede revisar solo.

function assertMember(group: Group, uid: string, campo: string): void {
  if (!group.miembros.includes(uid)) {
    throw badRequest("Datos invalidos", [{ campo, mensaje: "No es miembro del grupo" }]);
  }
}

// El pagador y los participantes deben ser miembros, y el reparto debe poder calcularse.
export function assertExpenseFitsGroup(group: Group, input: ExpenseInput): void {
  assertMember(group, input.pagador_uid, "pagador_uid");
  for (const uid of input.participantes) {
    assertMember(group, uid, "participantes");
  }
  if (input.porcentajes) {
    const sameUids =
      [...input.participantes].sort().join() === Object.keys(input.porcentajes).sort().join();
    if (!sameUids) {
      throw badRequest("Datos invalidos", [
        { campo: "porcentajes", mensaje: "Deben ser los mismos uid de participantes" },
      ]);
    }
  }
  // Se hace el reparto con la logica del dominio. Si falla (repetidos, porcentajes que no suman 100)
  // el gasto no se guarda.
  try {
    if (input.porcentajes) {
      splitByPercent(input.monto_centavos, input.porcentajes);
    } else {
      splitEqually(input.monto_centavos, input.participantes);
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Reparto invalido";
    throw badRequest("Datos invalidos", [{ campo: "participantes", mensaje }]);
  }
}

// Un pago va entre dos miembros distintos.
export function assertPaymentFitsGroup(group: Group, input: PaymentInput): void {
  assertMember(group, input.de_uid, "de_uid");
  assertMember(group, input.a_uid, "a_uid");
  if (input.de_uid === input.a_uid) {
    throw badRequest("Datos invalidos", [
      { campo: "a_uid", mensaje: "No puede ser la misma persona que paga" },
    ]);
  }
}
