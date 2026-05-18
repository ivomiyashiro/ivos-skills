# Arquitectura: Vertical Slice + CQRS Lite

## Por qué vertical slice

En arquitectura **layered** (controllers/services/repositories/...), agregar un feature
toca múltiples carpetas y los archivos relacionados quedan dispersos. Cada feature
arrastra un poco de cada capa, y el blast radius crece linealmente con la cantidad de
features.

En **vertical slice**, cada feature es una carpeta autocontenida. Para implementar
"crear quote" abrís `features/quotes/commands/create-quote.ts` y todo lo que necesitás
está ahí o en `shared/`. Los slices son independientes — podés eliminar uno
borrando una carpeta.

## CQRS Lite

**Lite** porque:
- Hay separación entre **comandos** (mutan estado) y **queries** (leen).
- No hay event sourcing.
- No hay un read model separado físicamente (mismo DB, mismas tablas).
- Sí hay shapes distintos: comandos usan `CommandDeps` con repositorio; queries usan
  `ReadContext` y leen directo.

**Por qué no full CQRS:** event sourcing y read models separados imponen costo
operacional (proyecciones, sincronización, eventual consistency). Pago solo cuando
hay justificación clara (performance read >> write, auditoría inmutable, etc.).

## Dirección de dependencias

```
features/<X>/  →  shared/
features/<X>/  ↛  features/<Y>/         (PROHIBIDO)
shared/        ↛  features/<X>/         (PROHIBIDO)
```

- Cualquier feature puede importar de `shared/`.
- **Ningún** feature importa de otro feature.
- `shared/` jamás importa de un feature.

Si dos features necesitan coordinarse:
1. **Domain events.** Feature A emite evento `XHappened`; feature B se suscribe en boot.
2. **Read-side join.** Una query de A puede joinear contra tablas de B; eso vive
   en el query handler y no rompe la regla (no importa código de B, lee SQL).
3. **Extraer a `shared/`.** Si el concepto es genuinamente cross-cutting (clock,
   logger, errores comunes), va a `shared/`.

## Anatomía de un slice

```
features/quotes/
  commands/                # Write side
    create-quote.ts        # 1 archivo = 1 caso de uso
    update-quote.ts
  queries/                 # Read side
    get-quote-by-id.ts
    list-quotes.ts
  repository.ts            # Solo escrituras
  read-context.ts          # Tipado y builder del read context
  schemas.ts               # Zod + DTOs
  events.ts                # Domain events que emite este feature
  routes.ts                # Hono router que compone todo
  routes.test.ts           # Integration tests
```

## Reglas inflexibles

1. Una carpeta `features/<X>/` = un agregado o un bounded context pequeño.
2. Si un feature tiene más de ~8 archivos en commands+queries, considerá dividirlo.
3. Los nombres de archivos son **kebab-case verbo-sustantivo**:
   `create-quote.ts`, `get-quote-by-id.ts`, `list-quotes.ts`.
4. `commands/` y `queries/` son **carpetas separadas** aunque tengan 1 archivo cada una.
   Sirve como semáforo visual para el lector.
5. `routes.ts` es plumbing: NO debe contener lógica de negocio. Solo arma
   `deps`/`ctx`, invoca handler, mapea Result a HTTP.

## Por qué funciones, no clases

- **Composición trivial:** un handler es `(deps, input) => Promise<Result>`. Mockear
  es solo construir el record `deps`. No `Mock<IQuoteService>`, no DI container.
- **Closures como constructor:** `createQuotesRepo(db) => { findById, save }`. El
  estado del "objeto" es el `db` capturado.
- **Composición de middlewares funcional:** Hono ya es funcional; no hay impedancia
  con OOP.
- **Tree-shaking:** importar `createQuoteHandler` no arrastra el resto del módulo.
- **Tests más rápidos:** sin reflexión, sin contenedor, sin proxies.

## Alternativas consideradas y rechazadas

- **Layered (controllers/services/repos):** rechazado por dispersión.
- **DDD heavy con aggregates/value objects/domain services:** rechazado por overkill.
  Si un feature necesita DDD denso, se aplica adentro del slice sin contaminar el resto.
- **Class-based services con un DI container (tsyringe, awilix):** rechazado.
  Factory + closures cubre el caso 90% sin la complejidad.
- **Event sourcing:** rechazado por costo. Opt-in si un feature lo justifica.
