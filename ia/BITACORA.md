# Bitacora de uso de IA

Cada uso importante de IA: para que se uso, que respondio, como se valido y que se decidio.
Tambien los casos en que se rechazo o se corrigio lo que propuso la IA. Minimo 3 casos reales.
Nunca se pegan claves ni el contenido de un .env.

| Fecha      | Herramienta y prompt resumido                                                    | Que respondio                                                                         | Como se valido                                                                                       | Decision                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-11-14 | Claude Code (Fable): "monta la base de calidad de la API y haz el primer commit" | Scripts de calidad, ESLint, Prettier, Vitest, ruta /api/health con su prueba y README | npm run check y npm run build en verde. La prueba de health fallo primero sin la ruta y paso despues | Aceptado. Se corrigio a la IA: la config de Vitest quedo como .mts para quitar un aviso, y se borro la carpeta .next vieja de la plantilla que rompia el typecheck |
