import { describe, expect, it } from "vitest";

import { parseEnv } from "@/src/lib/env";

const complete = {
  FIREBASE_PROJECT_ID: "proyecto",
  FIREBASE_CLIENT_EMAIL: "cuenta@correo.test",
  FIREBASE_PRIVATE_KEY: "linea1\nlinea2",
  FIREBASE_WEB_API_KEY: "clave-web",
};

describe("variables de entorno", () => {
  it("convierte los \n escritos de la clave privada en saltos de linea", () => {
    expect(parseEnv(complete).FIREBASE_PRIVATE_KEY).toBe("linea1\nlinea2");
  });

  it("si falta una variable dice cual, sin mostrar valores", () => {
    const incomplete = { ...complete, FIREBASE_WEB_API_KEY: undefined };

    expect(() => parseEnv(incomplete)).toThrow("FIREBASE_WEB_API_KEY");
    expect(() => parseEnv(incomplete)).not.toThrow("clave-web");
  });
});
