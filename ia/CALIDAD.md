# Calidad automatica - 34-gastos-compartidos-api

Evidencia de las reglas de calidad automaticas (hoja de configuracion de IA, secciones 6, 7 y 11).
Salida real tomada el 2026-11-18 en Windows con Node 24, sobre el commit indicado.

## Que corre `npm run check`

1. `typecheck`: `tsc --noEmit` con `strict` y `noUncheckedIndexedAccess`.
2. `lint`: `eslint . --max-warnings 0`, con complejidad maxima 10, funciones de maximo 50 lineas,
   profundidad maxima 3, archivos de maximo 300 lineas, sin `console`, `eqeqeq`, sin `any` ni `@ts-ignore`.
3. `format:check`: Prettier.
4. `test`: pruebas con cobertura y umbral del 80 % en `src/domain` y `src/lib`. Si la cobertura baja, el check falla.
5. `test:hook`: las 16 pruebas del hook PreToolUse con `node:test`.

Husky corre `gitleaks` y `lint-staged` antes de cada commit y `npm run check` antes de cada push.

## Resultado de `npm run check`

Commit: 7deb412 (mas el commit que agrega este archivo). Termino con codigo 0.

- Tipos, lint y formato: sin errores ni avisos.
- Pruebas: 6 archivos, **93 pruebas pasan**.
- Hook: **16 de 16** pasan.
- `npm run build`: compila sin errores.

## Cobertura

```text
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   96.26 |    84.47 |   97.27 |    96.1 |
 .../[gid]/balance |     100 |       50 |     100 |     100 |
  route.ts         |     100 |       50 |     100 |     100 | 22-23
 ...os/[gid]/pagos |     100 |       50 |     100 |     100 |
  route.ts         |     100 |       50 |     100 |     100 | 19
 src/domain        |     100 |    84.21 |     100 |     100 |
  settle.ts        |     100 |       75 |     100 |     100 | 13-26,46-50
  split.ts         |     100 |    88.88 |     100 |     100 | 31,65
 src/lib           |   91.75 |    89.58 |   89.28 |   91.57 |
  auth.ts          |     100 |     87.5 |     100 |     100 | 21
  firebase.ts      |       0 |        0 |       0 |       0 | 9-29
  groupRules.ts    |     100 |    91.66 |     100 |     100 | 39
...
Statements   : 96.26% ( 387/402 )
Branches     : 84.47% ( 136/161 )
Functions    : 97.27% ( 107/110 )
Lines        : 96.1% ( 370/385 )
```

`src/lib/firebase.ts` aparece en 0 % porque solo conecta con Firebase real; en las pruebas Firebase se simula.

## CI en GitHub Actions

En verde: https://github.com/iAdamn/34-gastos-compartidos-api/actions/runs/44418033610

Pasos: `npm ci`, `npm run check`, `npm run build`, `npm audit --audit-level=high` y, en otro trabajo,
`gitleaks` sobre todo el historial.
