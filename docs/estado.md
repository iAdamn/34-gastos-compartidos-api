# Estado de 34-gastos-compartidos-api

- Fase: base de calidad y dominio puro listos. Solo existe la ruta /api/health.
- Siguiente paso: B3 (Husky, lint-staged, CI y plantilla de PR), que quedo pendiente, y B4 (nucleo de la API).
- Fecha limite: sabado 2026-11-21.

## Que se hizo

- Paso B1: base de calidad. Scripts typecheck, lint, format:check, test y check. TypeScript con strict y noUncheckedIndexedAccess. ESLint con las reglas en error. Prettier. Vitest con cobertura y umbral del 80 % en src/domain y src/lib. Se quitaron la pagina, los estilos y public de la plantilla. Unica ruta: GET /api/health con su prueba.
- Paso B2: primer commit del repo con la configuracion de IA y los scripts de calidad.
- Paso B5 y B6: dominio puro en src/domain con sus pruebas, copiado del repo de la app. Solo cambia la linea que importa describe, it y expect, que aqui viene de vitest. money (monto valido y formato $100.000,00), split (reparto igual y por porcentajes, el sobrante va de a 1 peso al uid menor), balance (saldo de cada miembro), settle (pagos sugeridos, el que mas debe le paga al que mas le deben) y groupCode (codigo de 6 caracteres). Los casos salen de docs/casos-dominio.json.
- Se instalaron zod, firebase-admin, vitest, @vitest/coverage-v8 y prettier. @types/node subio a la version 24 porque vitest lo exige.

## Notas

- npm audit avisa 7 vulnerabilidades moderadas que vienen de dependencias de las herramientas. No se forzo ningun arreglo. La CI revisa solo las de nivel alto.
- Las carpetas src/lib, src/repos y src/services todavia no existen en git porque estan vacias.
- B1, B2, B5 y B6 los hizo el chat planificador desde la carpeta Final, a pedido de la persona, porque no se pudieron abrir chats en este repo por Control remoto. Desde aqui el trabajo de codigo se hace en un chat abierto en la raiz de este repo.

## Bloqueos

Ninguno.

## Por verificar

- Que las reglas de `.claude/settings.json` funcionan (lista en `ia/CONFIGURACION.md`).

## Como probar

`npm run check` y `npm run build`. Con `npm run dev`, abrir http://localhost:3000/api/health
