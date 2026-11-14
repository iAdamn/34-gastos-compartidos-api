# 34-gastos-compartidos-api

API del proyecto 34, gastos compartidos entre amigos. Materia Desarrollo Movil, TdeA.
La usa la app movil del repo `34-gastos-compartidos-app`. Maneja el login, los grupos, los gastos, los pagos y el balance.

Hecha con Next.js (Route Handlers), Firebase Admin, Zod y Vitest. Se despliega en Vercel.

## Como instalar y correr

```bash
npm install
npm run dev
```

Queda en http://localhost:3000. Para probar que responde: http://localhost:3000/api/health

## Comandos

| Comando                | Que hace                                          |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Servidor local                                    |
| `npm run build`        | Compila para produccion                           |
| `npm run typecheck`    | Revisa los tipos con TypeScript                   |
| `npm run lint`         | ESLint, no acepta warnings                        |
| `npm run format`       | Arregla el formato con Prettier                   |
| `npm run format:check` | Revisa el formato sin cambiar nada                |
| `npm test`             | Pruebas con cobertura                             |
| `npm run check`        | Corre typecheck, lint, format:check y las pruebas |

Si `npm run check` no pasa, el trabajo no esta terminado.

## Variables de entorno

Los valores reales viven solo en Vercel. En `env.example` hay valores falsos de ejemplo.

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_WEB_API_KEY`

## Rutas

Por ahora solo existe `GET /api/health`. El resto esta en `docs/contrato-api.md`.

## Dependencias y por que

| Paquete               | Para que                                                          |
| --------------------- | ----------------------------------------------------------------- |
| `next`                | Framework de la API, lo pide el enunciado                         |
| `firebase-admin`      | Verificar tokens y leer o escribir en Firestore desde el servidor |
| `zod`                 | Validar todo lo que llega en las peticiones                       |
| `vitest`              | Correr las pruebas, lo pide el enunciado                          |
| `@vitest/coverage-v8` | Medir la cobertura de las pruebas                                 |
| `prettier`            | Formato igual en todo el codigo                                   |
| `eslint`              | Reglas de calidad, venia con la plantilla                         |
| `eslint-config-next`  | Reglas de ESLint para Next, venia con la plantilla                |
| `typescript`          | Tipos, venia con la plantilla                                     |
| `@types/node`         | Tipos de Node. Se subio a la version 24 porque Vitest lo exige    |

## IA

La configuracion de IA y sus evidencias estan en `IA.md` y en la carpeta `ia/`.
