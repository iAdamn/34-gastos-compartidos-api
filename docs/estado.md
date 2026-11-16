# Estado de 34-gastos-compartidos-api

- Fase: API completa, desplegada y probada contra Firebase real. Proyecto individual. Fecha limite: sabado 2026-11-21.
- Repo: https://github.com/iAdamn/34-gastos-compartidos-api (publico, CI de GitHub Actions: https://github.com/iAdamn/34-gastos-compartidos-api/actions).
- API: https://34-gastos-compartidos-api.vercel.app (proyecto Vercel 34-gastos-compartidos-api, Firebase gastos-compartidos-34). Las claves viven solo en Vercel.
- Calidad: `npm run check` en verde con 93 pruebas de Vitest y 16 del hook, y `npm run build` en verde. Husky corre lint-staged y gitleaks (si esta instalado) al commitear y `npm run check` al hacer push.

## Que hay

- Rutas: health, auth (registro, login, refresh, yo), grupos (crear, unirse, listar), gastos, pagos, balance y cambios. Todas las de grupo responden 403 a quien no es miembro y el `uid` sale del token.
- Firebase solo por Admin SDK; las reglas de Firestore niegan todo acceso directo. Las pruebas simulan Firebase: no hay claves en el disco.
- Limite de intentos en el Firewall de Vercel: 10 peticiones por minuto por IP en login, registro, refresh y unirse (429 al pasarse). La regla vive en Vercel, no en el repo.
- IA: hook `PreToolUse` registrado en `.claude/settings.json` por la persona (`ia/hook/`), `ia/BITACORA.md`, `ia/RETOS.md` (hook, cero secretos en disco y gitleaks).
- Revision de seguridad hecha por otro chat (Opus, solo lectura); los hallazgos se corrigieron con pruebas (commit `516a595`).

## Que falta

- De la persona: canario y las 10 pruebas de contencion con capturas (C2, C5), ensayo de la sustentacion (C9).
- Revision final de Fable (B12, C8) y redactar las evidencias con los resultados reales (C6).
- El trabajo `secretos` (gitleaks) de la CI esta escrito pero no se ha visto correr: necesita un `git push`, que autoriza la persona.

## Notas

- `npm audit` avisa 7 vulnerabilidades moderadas de las herramientas; la CI solo falla con nivel alto. No se forzo ningun arreglo.
- En Vercel se fijo Node 24 en `engines` y `jwks-rsa` 3.2.2 en `overrides`: con jwks-rsa 4 las rutas con token daban 500 por `ERR_REQUIRE_ESM`.
- `src/lib/firebase.ts` no tiene pruebas porque solo conecta con Firebase real; se comprobo con la API desplegada.

## Como probar

```bash
npm install
npm run check
npm run build
npm run dev   # y abrir http://localhost:3000/api/health
```

En produccion: `GET https://34-gastos-compartidos-api.vercel.app/api/health` responde `{ "ok": true }`.
