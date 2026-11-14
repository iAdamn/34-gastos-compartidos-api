import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getBalance } from "@/app/api/grupos/[gid]/balance/route";
import { GET as getChanges } from "@/app/api/grupos/[gid]/cambios/route";
import { DELETE as deleteExpense } from "@/app/api/grupos/[gid]/gastos/[id]/route";
import { POST as createExpense } from "@/app/api/grupos/[gid]/gastos/route";
import { POST as createPayment } from "@/app/api/grupos/[gid]/pagos/route";
import { POST as createGroup } from "@/app/api/grupos/route";
import { POST as joinGroup } from "@/app/api/grupos/unirse/route";

import { resetFakeFirestore } from "./helpers/fakeFirestore";
import { EXPENSE_ID, OTHER_EXPENSE_ID, PAYMENT_ID, makeRequest, params } from "./helpers/requests";

vi.mock("@/src/lib/firebase", async () => {
  const fake = await import("./helpers/fakeFirestore");
  return { getDb: () => fake.fakeDb, getAdminAuth: () => fake.fakeAuth };
});

let gid = "";

// 100.000 pesos que paga ana, entre ana, beto y caro.
const expenseBody = {
  id: EXPENSE_ID,
  pagador_uid: "ana",
  descripcion: "Mercado",
  monto_centavos: 10000000,
  participantes: ["ana", "beto", "caro"],
  porcentajes: null,
  fecha: "2026-11-14",
};

function postExpense(token: string | undefined, body: unknown) {
  return createExpense(
    makeRequest("POST", `/api/grupos/${gid}/gastos`, { token, body }),
    params({ gid }),
  );
}

function postPayment(token: string | undefined, body: unknown) {
  return createPayment(
    makeRequest("POST", `/api/grupos/${gid}/pagos`, { token, body }),
    params({ gid }),
  );
}

function removeExpense(token: string, id: string) {
  return deleteExpense(
    makeRequest("DELETE", `/api/grupos/${gid}/gastos/${id}`, { token }),
    params({ gid, id }),
  );
}

function balanceFor(token: string | undefined) {
  return getBalance(makeRequest("GET", `/api/grupos/${gid}/balance`, { token }), params({ gid }));
}

function changesFor(token: string, query = "") {
  return getChanges(
    makeRequest("GET", `/api/grupos/${gid}/cambios${query}`, { token }),
    params({ gid }),
  );
}

// Antes de cada prueba: grupo de ana, beto y caro. "dani" queda por fuera.
beforeEach(async () => {
  resetFakeFirestore();
  const created = await createGroup(
    makeRequest("POST", "/api/grupos", {
      token: "token-ana",
      body: { nombre: "Paseo", mi_nombre: "Ana" },
    }),
  );
  const { grupo } = await created.json();
  gid = grupo.id;
  for (const name of ["beto", "caro"]) {
    await joinGroup(
      makeRequest("POST", "/api/grupos/unirse", {
        token: `token-${name}`,
        body: { codigo: grupo.codigo, mi_nombre: name },
      }),
    );
  }
});

describe("acceso a un grupo", () => {
  it("sin token responde 401", async () => {
    expect((await balanceFor(undefined)).status).toBe(401);
    expect((await postExpense(undefined, expenseBody)).status).toBe(401);
  });

  it("un usuario que no es miembro recibe 403 en todas las rutas del grupo", async () => {
    expect((await balanceFor("token-dani")).status).toBe(403);
    expect((await changesFor("token-dani")).status).toBe(403);
    expect((await postExpense("token-dani", expenseBody)).status).toBe(403);
    expect((await removeExpense("token-dani", EXPENSE_ID)).status).toBe(403);
    expect(
      (
        await postPayment("token-dani", {
          id: PAYMENT_ID,
          de_uid: "beto",
          a_uid: "ana",
          monto_centavos: 100,
        })
      ).status,
    ).toBe(403);
  });

  it("un grupo que no existe responde 404", async () => {
    const response = await getBalance(
      makeRequest("GET", "/api/grupos/no-existe/balance", { token: "token-ana" }),
      params({ gid: "no-existe" }),
    );

    expect(response.status).toBe(404);
  });
});

describe("POST /api/grupos/:gid/gastos", () => {
  it("crea el gasto y guarda quien lo creo segun el token", async () => {
    const response = await postExpense("token-beto", {
      ...expenseBody,
      creado_por: "ana",
      extra: "x",
    });
    const { gasto } = await response.json();

    expect(response.status).toBe(201);
    expect(gasto.creado_por).toBe("beto");
    expect(gasto.deleted_at).toBeNull();
    // Los campos que no estan declarados no se guardan.
    expect(gasto.extra).toBeUndefined();
  });

  it("repetir el mismo id no duplica y responde 200", async () => {
    await postExpense("token-ana", expenseBody);

    const response = await postExpense("token-ana", expenseBody);
    const changes = await (await changesFor("token-ana")).json();

    expect(response.status).toBe(200);
    expect(changes.gastos).toHaveLength(1);
  });

  it.each([
    ["monto en cero", { monto_centavos: 0 }],
    ["monto con centavos sueltos", { monto_centavos: 150 }],
    ["monto con decimales", { monto_centavos: 100.5 }],
    ["sin participantes", { participantes: [] }],
    ["participantes repetidos", { participantes: ["ana", "ana"] }],
    ["participante que no es miembro", { participantes: ["ana", "dani"] }],
    ["pagador que no es miembro", { pagador_uid: "dani" }],
    ["descripcion vacia", { descripcion: "  " }],
    ["fecha mal escrita", { fecha: "14/11/2026" }],
    ["id que no es UUID", { id: "abc" }],
    ["porcentajes que suman 99", { porcentajes: { ana: 50, beto: 30, caro: 19 } }],
    ["porcentajes de otras personas", { porcentajes: { ana: 50, beto: 50 } }],
  ])("responde 400 con %s", async (_name, change) => {
    const response = await postExpense("token-ana", { ...expenseBody, ...change });

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeTruthy();
  });

  it("acepta porcentajes que suman 100", async () => {
    const response = await postExpense("token-ana", {
      ...expenseBody,
      porcentajes: { ana: 50, beto: 30, caro: 20 },
    });

    expect(response.status).toBe(201);
  });
});

describe("DELETE /api/grupos/:gid/gastos/:id", () => {
  it("solo quien creo el gasto puede eliminarlo", async () => {
    await postExpense("token-ana", expenseBody);

    const byOther = await removeExpense("token-beto", EXPENSE_ID);
    const byCreator = await removeExpense("token-ana", EXPENSE_ID);

    expect(byOther.status).toBe(403);
    expect(byCreator.status).toBe(200);
    expect(await byCreator.json()).toEqual({ ok: true });
  });

  it("responde 404 si el gasto no existe", async () => {
    expect((await removeExpense("token-ana", OTHER_EXPENSE_ID)).status).toBe(404);
  });

  it("el borrado es logico: el gasto sigue en cambios con deleted_at", async () => {
    await postExpense("token-ana", expenseBody);
    await removeExpense("token-ana", EXPENSE_ID);

    const changes = await (await changesFor("token-ana")).json();

    expect(changes.gastos).toHaveLength(1);
    expect(changes.gastos[0].deleted_at).not.toBeNull();
  });
});

describe("POST /api/grupos/:gid/pagos", () => {
  it("registra el pago entre dos miembros", async () => {
    const response = await postPayment("token-caro", {
      id: PAYMENT_ID,
      de_uid: "beto",
      a_uid: "ana",
      monto_centavos: 2000000,
    });

    expect(response.status).toBe(201);
    expect((await response.json()).pago.creado_por).toBe("caro");
  });

  it.each([
    ["la misma persona", { de_uid: "ana", a_uid: "ana" }],
    ["alguien que no es miembro", { a_uid: "dani" }],
    ["monto en cero", { monto_centavos: 0 }],
  ])("responde 400 con %s", async (_name, change) => {
    const response = await postPayment("token-ana", {
      id: PAYMENT_ID,
      de_uid: "beto",
      a_uid: "ana",
      monto_centavos: 2000000,
      ...change,
    });

    expect(response.status).toBe(400);
  });
});

describe("GET /api/grupos/:gid/balance", () => {
  it("calcula saldos que suman 0 y los pagos sugeridos", async () => {
    await postExpense("token-ana", expenseBody);

    const body = await (await balanceFor("token-beto")).json();
    const total = body.balances.reduce(
      (sum: number, item: { saldo_centavos: number }) => sum + item.saldo_centavos,
      0,
    );

    // 100.000 entre 3: ana 33.334, beto 33.333, caro 33.333. Ana pago todo.
    expect(body.balances).toEqual([
      { uid: "ana", nombre: "Ana", saldo_centavos: 6666600 },
      { uid: "beto", nombre: "beto", saldo_centavos: -3333300 },
      { uid: "caro", nombre: "caro", saldo_centavos: -3333300 },
    ]);
    expect(total).toBe(0);
    expect(body.pagos_sugeridos).toEqual([
      { de_uid: "beto", a_uid: "ana", monto_centavos: 3333300 },
      { de_uid: "caro", a_uid: "ana", monto_centavos: 3333300 },
    ]);
  });

  it("los pagos cambian el balance y los gastos eliminados no cuentan", async () => {
    await postExpense("token-ana", expenseBody);
    await postPayment("token-beto", {
      id: PAYMENT_ID,
      de_uid: "beto",
      a_uid: "ana",
      monto_centavos: 3333300,
    });
    await postExpense("token-beto", { ...expenseBody, id: OTHER_EXPENSE_ID });
    await removeExpense("token-beto", OTHER_EXPENSE_ID);

    const body = await (await balanceFor("token-ana")).json();

    expect(body.balances[1]).toEqual({ uid: "beto", nombre: "beto", saldo_centavos: 0 });
    expect(body.pagos_sugeridos).toEqual([
      { de_uid: "caro", a_uid: "ana", monto_centavos: 3333300 },
    ]);
  });
});

describe("GET /api/grupos/:gid/cambios", () => {
  it("sin since devuelve el grupo, todos los gastos y todos los pagos", async () => {
    await postExpense("token-ana", expenseBody);
    await postPayment("token-beto", {
      id: PAYMENT_ID,
      de_uid: "beto",
      a_uid: "ana",
      monto_centavos: 100,
    });

    const body = await (await changesFor("token-caro")).json();

    expect(body.grupo.id).toBe(gid);
    expect(body.gastos).toHaveLength(1);
    expect(body.pagos).toHaveLength(1);
    expect(typeof body.servidor_ahora).toBe("string");
  });

  it("con since devuelve solo lo modificado despues", async () => {
    await postExpense("token-ana", expenseBody);
    const future = "2999-01-01T00:00:00.000Z";

    const body = await (
      await changesFor("token-ana", `?since=${encodeURIComponent(future)}`)
    ).json();

    expect(body.gastos).toEqual([]);
    expect(body.pagos).toEqual([]);
  });

  it("responde 400 si since no es una fecha", async () => {
    expect((await changesFor("token-ana", "?since=ayer")).status).toBe(400);
  });
});
