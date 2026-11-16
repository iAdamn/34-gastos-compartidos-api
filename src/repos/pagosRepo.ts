import { getDb } from "@/src/lib/firebase";
import { isAlreadyExists } from "@/src/lib/firestoreErrors";
import { MAX_SYNC_ITEMS, type Payment } from "@/src/lib/types";
import type { PaymentInput } from "@/src/lib/validation";

// Los pagos entre miembros viven en grupos/{gid}/pagos/{id}.
// Solo esta API escribe estos documentos, por eso se leen como Payment.
function paymentsOf(gid: string) {
  return getDb().collection("grupos").doc(gid).collection("pagos");
}

// Registra el pago con create(), que falla si el id ya existe.
// Si ya existia se devuelve el guardado: repetir el envio no duplica.
export async function createPayment(
  gid: string,
  uid: string,
  input: PaymentInput,
): Promise<{ payment: Payment; created: boolean }> {
  const ref = paymentsOf(gid).doc(input.id);
  const now = new Date().toISOString();
  const payment: Payment = { ...input, fecha: now, creado_por: uid, updated_at: now };
  try {
    await ref.create(payment);
    return { payment, created: true };
  } catch (error) {
    if (!isAlreadyExists(error)) {
      throw error;
    }
    return { payment: (await ref.get()).data() as Payment, created: false };
  }
}

export async function listPayments(gid: string): Promise<Payment[]> {
  const result = await paymentsOf(gid).get();
  return result.docs.map((doc) => doc.data() as Payment);
}

// Pagos registrados despues de "since". Sin "since" van todos.
export async function listChangedPayments(gid: string, since: string | null): Promise<Payment[]> {
  const base = paymentsOf(gid);
  const filtered = since ? base.where("updated_at", ">", since) : base;
  const result = await filtered.orderBy("updated_at").limit(MAX_SYNC_ITEMS).get();
  return result.docs.map((doc) => doc.data() as Payment);
}
