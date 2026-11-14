import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as listGroups, POST as createGroup } from "@/app/api/grupos/route";
import { POST as joinGroup } from "@/app/api/grupos/unirse/route";
import { isValidGroupCode } from "@/src/domain/groupCode";

import { fakeDb, resetFakeFirestore } from "./helpers/fakeFirestore";
import { makeRequest } from "./helpers/requests";

vi.mock("@/src/lib/firebase", async () => {
  const fake = await import("./helpers/fakeFirestore");
  return { getDb: () => fake.fakeDb, getAdminAuth: () => fake.fakeAuth };
});

// Crea un grupo como "ana" y devuelve el grupo de la respuesta.
async function createAsAna() {
  const response = await createGroup(
    makeRequest("POST", "/api/grupos", {
      token: "token-ana",
      body: { nombre: "Paseo", mi_nombre: "Ana" },
    }),
  );
  return (await response.json()).grupo;
}

function join(token: string, codigo: string, miNombre = "Invitado") {
  return joinGroup(
    makeRequest("POST", "/api/grupos/unirse", { token, body: { codigo, mi_nombre: miNombre } }),
  );
}

beforeEach(() => {
  resetFakeFirestore();
});

describe("POST /api/grupos", () => {
  it("responde 401 sin token", async () => {
    const response = await createGroup(
      makeRequest("POST", "/api/grupos", { body: { nombre: "Paseo", mi_nombre: "Ana" } }),
    );

    expect(response.status).toBe(401);
  });

  it("responde 400 si falta el nombre", async () => {
    const response = await createGroup(
      makeRequest("POST", "/api/grupos", { token: "token-ana", body: { mi_nombre: "Ana" } }),
    );

    expect(response.status).toBe(400);
  });

  it("crea el grupo con un codigo de 6 caracteres y al creador como miembro", async () => {
    const response = await createGroup(
      makeRequest("POST", "/api/grupos", {
        token: "token-ana",
        body: { nombre: "Paseo", mi_nombre: "Ana", creador_uid: "otro", miembros: ["otro"] },
      }),
    );
    const { grupo } = await response.json();

    expect(response.status).toBe(201);
    expect(isValidGroupCode(grupo.codigo)).toBe(true);
    // El uid sale del token: lo que mande el cliente en el cuerpo se ignora.
    expect(grupo.creador_uid).toBe("ana");
    expect(grupo.miembros).toEqual(["ana"]);
    expect(grupo.miembros_info).toEqual({ ana: { nombre: "Ana" } });
  });

  it("si el codigo ya existe genera otro", async () => {
    const first = await createAsAna();
    // Se fuerza el azar para que el primer intento repita el codigo que ya existe.
    const random = vi.spyOn(Math, "random");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (const character of first.codigo) {
      random.mockReturnValueOnce(alphabet.indexOf(character) / alphabet.length);
    }
    const second = await createAsAna();
    random.mockRestore();

    expect(second.codigo).not.toBe(first.codigo);
    expect(isValidGroupCode(second.codigo)).toBe(true);
  });
});

describe("POST /api/grupos/unirse", () => {
  it("con un codigo inexistente responde 404 Grupo no encontrado", async () => {
    const response = await join("token-beto", "ZZZZZZ");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Grupo no encontrado" });
  });

  it("responde 400 si el codigo no tiene 6 caracteres", async () => {
    const response = await join("token-beto", "ABC");

    expect(response.status).toBe(400);
  });

  it("agrega al usuario como miembro, aunque escriba el codigo en minusculas", async () => {
    const group = await createAsAna();

    const response = await join("token-beto", group.codigo.toLowerCase(), "Beto");
    const { grupo } = await response.json();

    expect(response.status).toBe(200);
    expect(grupo.miembros).toEqual(["ana", "beto"]);
    expect(grupo.miembros_info.beto).toEqual({ nombre: "Beto" });
  });

  it("unirse dos veces no duplica al miembro", async () => {
    const group = await createAsAna();
    await join("token-beto", group.codigo);

    const response = await join("token-beto", group.codigo);

    expect(response.status).toBe(200);
    expect((await response.json()).grupo.miembros).toEqual(["ana", "beto"]);
  });

  it("el miembro 21 recibe 409 El grupo esta lleno", async () => {
    const group = await createAsAna();
    const twentyMembers = Array.from({ length: 20 }, (_, index) => `uid-${index}`);
    await fakeDb.collection("grupos").doc(group.id).update({ miembros: twentyMembers });

    const response = await join("token-beto", group.codigo);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "El grupo esta lleno" });
  });
});

describe("GET /api/grupos", () => {
  it("devuelve solo los grupos donde soy miembro", async () => {
    const group = await createAsAna();

    const forAna = await listGroups(makeRequest("GET", "/api/grupos", { token: "token-ana" }));
    const forBeto = await listGroups(makeRequest("GET", "/api/grupos", { token: "token-beto" }));

    expect((await forAna.json()).items.map((item: { id: string }) => item.id)).toEqual([group.id]);
    expect((await forBeto.json()).items).toEqual([]);
  });
});
