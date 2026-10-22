# Cómo contribuir

¡Gracias por querer sumar! Algunas reglas para mantener el proyecto sano.

## Principios que no se negocian

1. **Solo software y recursos libres** (licencias OSI/FSF compatibles con GPL-3.0-or-later). Toda dependencia o recurso nuevo va en `THIRD_PARTY.md` y se regenera `docs/dependencies.md` (`python3 scripts/third_party.py > docs/dependencies.md`).
2. **Cero telemetría y offline por defecto.** Nada de analytics, crash reporters remotos, CDNs, fuentes remotas ni chequeos de actualización. La UI no puede usar la red (CSP); cualquier uso de red pasa por el backend, respeta `network.allowed` y se anota en el registro.
3. **Progresión lineal.** Nada se muestra antes de aprenderse. Si agregás un generador o contenido, tiene que pasar la auditoría.

## Agregar una lección

1. En `src/core/curriculum/lessons.ts`, agregá la lección en el lugar correcto de su rama, con su concepto único, requisitos de otras ramas (solo del tronco) y los generadores.
2. En `src/content/es-AR/`, agregá título, explicación (bloques `P`, `TIP`, `EX`) y preguntas (`Q`). Marcá los términos nuevos con `[[concepto|término]]`.
3. Si el concepto aparece en partituras o acordes, enseñale a `src/core/curriculum/extract.ts` a detectarlo.
4. `npm test`: los tests de progresión verifican que ningún ejercicio ni ejemplo use algo no aprendido y que el vocabulario esté controlado (`src/content/terms.ts`).

## Agregar un generador de ejercicios

- Implementá `Generator` (`requires`, `canRun`, `make`) en `src/core/curriculum/gen/`, registralo en `gen/index.ts`.
- Declará en `uses` todo concepto que aparezca (aunque la auditoría lo vuelva a revisar).
- Todos los textos van como `Msg` con clave en `src/i18n/es-AR.ts`.

## Estilo

- TypeScript estricto, Svelte 5 (runes), Rust edición 2021. Comentarios y textos en español.
- Encabezado `SPDX-License-Identifier: GPL-3.0-or-later` en cada archivo fuente.
- Commits atómicos con mensaje claro en español.

## Antes de mandar un cambio

```bash
npm test && npm run check && cargo test --workspace
```
