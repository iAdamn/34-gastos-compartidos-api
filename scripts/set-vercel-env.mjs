// Carga en Vercel (production) las 4 variables de Firebase sin mostrarlas en pantalla.
// Uso: node scripts/set-vercel-env.mjs
// Pide la ruta del JSON de la cuenta de servicio y la clave de API web (oculta al escribir).
// Los valores van a la CLI de Vercel por la entrada estandar: no quedan en archivos ni en argumentos.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

function ask(question, hidden = false) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text);
    };
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

function addVariable(name, value) {
  const result = spawnSync("npx", ["vercel@latest", "env", "add", name, "production", "--force"], {
    input: value,
    shell: true,
    stdio: ["pipe", "ignore", "pipe"],
  });
  const ok = result.status === 0;
  process.stdout.write(`${ok ? "OK   " : "FALLO"} ${name}\n`);
  if (!ok) process.stdout.write(`${result.stderr.toString().split("\n").slice(-3).join("\n")}\n`);
  return ok;
}

const path = (
  await ask("Ruta del JSON de la cuenta de servicio (puedes arrastrar el archivo aqui): ")
).replace(/^["']|["']$/g, "");
const account = JSON.parse(readFileSync(path, "utf8"));
const webApiKey = await ask("Pega la clave de API web de Firebase (no se vera) y Enter: ", true);

const variables = {
  FIREBASE_PROJECT_ID: account.project_id,
  FIREBASE_CLIENT_EMAIL: account.client_email,
  FIREBASE_PRIVATE_KEY: account.private_key,
  FIREBASE_WEB_API_KEY: webApiKey,
};

const missing = Object.entries(variables)
  .filter(([, value]) => !value)
  .map(([name]) => name);
if (missing.length > 0) {
  process.stdout.write(`Faltan valores: ${missing.join(", ")}. No se cargo nada.\n`);
  process.exit(1);
}

const results = Object.entries(variables).map(([name, value]) => addVariable(name, value));
process.stdout.write(
  results.every(Boolean) ? "Listo. Ya puedes borrar el JSON.\n" : "Alguna variable fallo.\n",
);
