import { forbidden, notFound } from "@/src/lib/errors";
import { getDb } from "@/src/lib/firebase";
import { MAX_SYNC_ITEMS, type Expense } from "@/src/lib/types";
import type { ExpenseInput } from "@/src/lib/validation";

// Los gastos viven en grupos/{gid}/gastos/{id}.
// Solo esta API escribe estos documentos, por eso se leen como Expense.
function expensesOf(gid: string) {
  return getDb().collection("grupos").doc(gid).collection("gastos");
}

// Crea el gasto. Si ya existe uno con ese id devuelve el guardado: repetir el envio no duplica.
export async function createExpense(
  gid: string,
  uid: string,
  input: ExpenseInput,
): Promise<{ expense: Expense; created: boolean }> {
  const ref = expensesOf(gid).doc(input.id);
  const existing = (await ref.get()).data() as Expense | undefined;
  if (existing) {
    return { expense: existing, created: false };
  }
  const now = new Date().toISOString();
  const expense: Expense = {
    ...input,
    creado_por: uid,
    lat: null,
    lng: null,
    creado_en: now,
    updated_at: now,
    deleted_at: null,
  };
  await ref.set(expense);
  return { expense, created: true };
}

// Borrado logico. Solo quien creo el gasto puede eliminarlo.
export async function deleteExpense(gid: string, id: string, uid: string): Promise<void> {
  const ref = expensesOf(gid).doc(id);
  const expense = (await ref.get()).data() as Expense | undefined;
  if (!expense) {
    throw notFound("Gasto no encontrado");
  }
  if (expense.creado_por !== uid) {
    throw forbidden("Solo quien creo el gasto puede eliminarlo");
  }
  if (expense.deleted_at === null) {
    const now = new Date().toISOString();
    await ref.update({ deleted_at: now, updated_at: now });
  }
}

// Gastos que cuentan para el balance: los que no estan eliminados.
export async function listActiveExpenses(gid: string): Promise<Expense[]> {
  const result = await expensesOf(gid).get();
  const expenses = result.docs.map((doc) => doc.data() as Expense);
  return expenses.filter((expense) => expense.deleted_at === null);
}

// Gastos modificados despues de "since", incluidos los eliminados. Sin "since" van todos.
export async function listChangedExpenses(gid: string, since: string | null): Promise<Expense[]> {
  const base = expensesOf(gid);
  const filtered = since ? base.where("updated_at", ">", since) : base;
  const result = await filtered.orderBy("updated_at").limit(MAX_SYNC_ITEMS).get();
  return result.docs.map((doc) => doc.data() as Expense);
}
