import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as login } from "@/app/api/auth/login/route";
import { POST as refresh } from "@/app/api/auth/refresh/route";
import { POST as register } from "@/app/api/auth/registro/route";
import { GET as me } from "@/app/api/auth/yo/route";

import { makeRequest } from "./helpers/requests";

vi.mock("@/src/lib/firebase", async () => {
  const fake = await import("./helpers/fakeFirestore");
  return { getDb: () => fake.fakeDb, getAdminAuth: () => fake.fakeAuth };
});

// Respuesta de mentira de la API REST de Firebase Auth.
function firebaseAnswers(status: number, body: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(body, { status })),
  );
}

const session = {
  idToken: "id-token",
  refreshToken: "refresh-token",
  expiresIn: "3600",
  localId: "uid-ana",
  email: "ana@correo.test",
};

beforeEach(() => {
  vi.stubEnv("FIREBASE_PROJECT_ID", "proyecto-de-prueba");
  vi.stubEnv("FIREBASE_CLIENT_EMAIL", "prueba@correo.test");
  vi.stubEnv("FIREBASE_PRIVATE_KEY", "clave-de-prueba");
  vi.stubEnv("FIREBASE_WEB_API_KEY", "clave-web-de-prueba");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/auth/registro", () => {
  it("crea la cuenta y responde 201 con los tokens", async () => {
    firebaseAnswers(200, session);

    const response = await register(
      makeRequest("POST", "/api/auth/registro", {
        body: { email: "ana@correo.test", password: "clave-larga" },
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      token: "id-token",
      refreshToken: "refresh-token",
      expiraEnSeg: 3600,
      usuario: { id: "uid-ana", email: "ana@correo.test" },
    });
  });

  it("responde 400 si la contrasena tiene menos de 8 caracteres", async () => {
    const response = await register(
      makeRequest("POST", "/api/auth/registro", {
        body: { email: "ana@correo.test", password: "corta" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.detalles[0].campo).toBe("password");
  });

  it("responde 400 si el cuerpo no es JSON", async () => {
    const response = await register(makeRequest("POST", "/api/auth/registro", { rawBody: "{" }));

    expect(response.status).toBe(400);
  });

  it("responde 409 si el correo ya existe", async () => {
    firebaseAnswers(400, { error: { message: "EMAIL_EXISTS" } });

    const response = await register(
      makeRequest("POST", "/api/auth/registro", {
        body: { email: "ana@correo.test", password: "clave-larga" },
      }),
    );

    expect(response.status).toBe(409);
  });

  it("responde 400 si Firebase dice que la contrasena es debil", async () => {
    firebaseAnswers(400, { error: { message: "WEAK_PASSWORD : Password should be longer" } });

    const response = await register(
      makeRequest("POST", "/api/auth/registro", {
        body: { email: "ana@correo.test", password: "clave-larga" },
      }),
    );

    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("responde 200 con los tokens", async () => {
    firebaseAnswers(200, session);

    const response = await login(
      makeRequest("POST", "/api/auth/login", {
        body: { email: "ana@correo.test", password: "clave-larga" },
      }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).token).toBe("id-token");
  });

  it("responde 401 con el mismo mensaje exista o no el correo", async () => {
    const messages: string[] = [];
    for (const firebaseError of [
      "EMAIL_NOT_FOUND",
      "INVALID_PASSWORD",
      "INVALID_LOGIN_CREDENTIALS",
    ]) {
      firebaseAnswers(400, { error: { message: firebaseError } });
      const response = await login(
        makeRequest("POST", "/api/auth/login", {
          body: { email: "ana@correo.test", password: "otra-clave" },
        }),
      );
      expect(response.status).toBe(401);
      messages.push((await response.json()).error);
    }

    expect(new Set(messages).size).toBe(1);
  });

  it("responde 429 si hay demasiados intentos", async () => {
    firebaseAnswers(400, { error: { message: "TOO_MANY_ATTEMPTS_TRY_LATER : Try later" } });

    const response = await login(
      makeRequest("POST", "/api/auth/login", {
        body: { email: "ana@correo.test", password: "otra-clave" },
      }),
    );

    expect(response.status).toBe(429);
  });

  it("responde 500 sin detalles si Firebase falla de una forma rara", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    firebaseAnswers(500, { error: { message: "ALGO_INESPERADO" } });

    const response = await login(
      makeRequest("POST", "/api/auth/login", {
        body: { email: "ana@correo.test", password: "otra-clave" },
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Error interno" });
    consoleError.mockRestore();
  });
});

describe("POST /api/auth/refresh", () => {
  it("responde 200 con tokens nuevos", async () => {
    firebaseAnswers(200, { id_token: "nuevo", refresh_token: "nuevo-refresh", expires_in: "3600" });

    const response = await refresh(
      makeRequest("POST", "/api/auth/refresh", { body: { refreshToken: "refresh-token" } }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      token: "nuevo",
      refreshToken: "nuevo-refresh",
      expiraEnSeg: 3600,
    });
  });

  it("responde 401 si el refreshToken no sirve", async () => {
    firebaseAnswers(400, { error: { message: "INVALID_REFRESH_TOKEN" } });

    const response = await refresh(
      makeRequest("POST", "/api/auth/refresh", { body: { refreshToken: "malo" } }),
    );

    expect(response.status).toBe(401);
  });
});

describe("GET /api/auth/yo", () => {
  it("responde 401 sin token", async () => {
    const response = await me(makeRequest("GET", "/api/auth/yo"));

    expect(response.status).toBe(401);
  });

  it("responde 401 con un token invalido", async () => {
    const response = await me(makeRequest("GET", "/api/auth/yo", { token: "cualquier-cosa" }));

    expect(response.status).toBe(401);
  });

  it("responde 200 con el usuario del token", async () => {
    const response = await me(makeRequest("GET", "/api/auth/yo", { token: "token-ana" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ usuario: { id: "ana", email: "ana@correo.test" } });
  });
});
