# Shared

`shared` no significa "cosas que no sé dónde poner". Significa código transversal
que no pertenece a una feature concreta.

## Permitido

- config/env
- db/client/transaction/schema
- errores y Result
- middlewares
- auth adapters
- observability
- openapi/router
- utilidades genéricas con uso real en varias features
- tipos globales como `Pagination`, `AuthPrincipal`, `RequestContext`

## No Permitido

- reglas de negocio de una feature
- mappers de una feature
- repositories extraídos por excepción
- DTOs específicos
- constantes locales como estados de `Project`
- helpers compartidos "por si acaso"

## Regla De Extracción

1. Primero mantenerlo en la feature.
2. Si otra feature lo necesita y es chico, duplicar puede ser aceptable.
3. Si aparece una abstracción real, mover a `shared`.
4. Si `shared` empieza a importar `features`, está roto.

El skeleton verifica esto con `bun run check:boundaries`.
