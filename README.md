# 34-gastos-compartidos-api

API del proyecto 34, gastos compartidos entre amigos. Materia Desarrollo Movil, TdeA.
La usa la app movil del repo `34-gastos-compartidos-app`. Maneja el login, los grupos, los gastos, los pagos y el balance.

Hecha con Next.js (Route Handlers), Firebase Admin, Zod y Vitest. Se despliega en Vercel.

## Como instalar y correr

Hace falta Node 24 (esta fijado en `engines`).

```bash
npm install
cp env.example .env.local   # y poner las claves de tu proyecto de Firebase
npm run dev
```

Queda en http://localhost:3000. Para probar que responde: http://localhost:3000/api/health.
La API publicada esta en https://34-gastos-compartidos-api.vercel.app.

## Comandos

| Comando                | Que hace                                              |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Servidor local                                        |
| `npm run build`        | Compila para produccion                               |
| `npm start`            | Sirve lo compilado con `npm run build`                |
| `npm run typecheck`    | Revisa los tipos con TypeScript                       |
| `npm run lint`         | ESLint, no acepta warnings                            |
| `npm run format`       | Arregla el formato con Prettier                       |
| `npm run format:check` | Revisa el formato sin cambiar nada                    |
| `npm test`             | Pruebas con cobertura                                 |
| `npm run test:hook`    | Pruebas del hook de IA (`ia/hook/`)                   |
| `npm run check`        | Corre typecheck, lint, format:check, test y test:hook |

Si `npm run check` no pasa, el trabajo no esta terminado.

## Variables de entorno

Los valores reales viven solo en Vercel. En `env.example` hay valores falsos de ejemplo.

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_WEB_API_KEY`

## Rutas

Todas menos health, registro, login y refresh piden la cabecera `Authorization: Bearer <token>`.
El detalle de cada una esta en `docs/contrato-api.md`.

| Ruta                                  | Que hace                                     |
| ------------------------------------- | -------------------------------------------- |
| `GET /api/health`                     | Dice si la API esta arriba                   |
| `POST /api/auth/registro`             | Crea la cuenta y devuelve los tokens         |
| `POST /api/auth/login`                | Inicia sesion                                |
| `POST /api/auth/refresh`              | Cambia el refreshToken por un token nuevo    |
| `GET /api/auth/yo`                    | Devuelve el usuario del token                |
| `POST /api/grupos`                    | Crea un grupo con su codigo                  |
| `GET /api/grupos`                     | Mis grupos                                   |
| `POST /api/grupos/unirse`             | Entra a un grupo con el codigo               |
| `POST /api/grupos/:gid/gastos`        | Registra un gasto                            |
| `DELETE /api/grupos/:gid/gastos/:id`  | Elimina un gasto, solo quien lo creo         |
| `POST /api/grupos/:gid/pagos`         | Registra un pago entre dos miembros          |
| `GET /api/grupos/:gid/balance`        | Saldo de cada miembro y pagos sugeridos      |
| `GET /api/grupos/:gid/cambios?since=` | Gastos y pagos modificados, para sincronizar |

Las rutas de un grupo responden 403 si el usuario no es miembro.

## Despliegue

Se despliega en Vercel. Las cuatro variables de arriba se cargan en el proyecto con `scripts/set-vercel-env.mjs`,
que lee el JSON de la cuenta de servicio sin mostrarlo. En el Firewall de Vercel hay un limite de 10 peticiones por minuto por IP
para login, registro, refresh y unirse.

## Como estan hechas las pruebas

Firebase no se usa de verdad en las pruebas. `tests/helpers/fakeFirestore.ts` es un Firestore en memoria
y las llamadas a Firebase Auth se reemplazan con respuestas de mentira. Asi no hace falta ninguna clave en el computador.

## Dependencias y por que

| Paquete                            | Para que                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `next`                             | Framework de la API, lo pide el enunciado                                 |
| `firebase-admin`                   | Verificar tokens y leer o escribir en Firestore desde el servidor         |
| `zod`                              | Validar todo lo que llega en las peticiones                               |
| `vitest`                           | Correr las pruebas, lo pide el enunciado                                  |
| `@vitest/coverage-v8`              | Medir la cobertura de las pruebas                                         |
| `prettier`                         | Formato igual en todo el codigo                                           |
| `eslint`                           | Reglas de calidad, venia con la plantilla                                 |
| `eslint-config-next`               | Reglas de ESLint para Next, venia con la plantilla                        |
| `typescript`                       | Tipos, venia con la plantilla                                             |
| `react`, `react-dom`               | Los exige Next, la API no tiene pantallas                                 |
| `@types/react`, `@types/react-dom` | Tipos de React, venian con la plantilla                                   |
| `husky`, `lint-staged`             | Revisar lo modificado al commitear y correr `npm run check` al hacer push |
| `@types/node`                      | Tipos de Node. Se subio a la version 24 porque Vitest lo exige            |

## IA

La configuracion de IA y sus evidencias estan en `IA.md` y en la carpeta `ia/`.
