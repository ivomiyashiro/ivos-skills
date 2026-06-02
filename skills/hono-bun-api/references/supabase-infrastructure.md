# Supabase Como Infraestructura

Tratar Supabase como proveedor de infraestructura, no como arquitectura de la app.

## Uso Recomendado

- Supabase Auth para identidad.
- Supabase Postgres como base principal.
- Drizzle para queries, transacciones y migraciones backend.
- Supabase Storage para archivos.
- Realtime solo si el producto lo necesita.
- RLS como defensa adicional.

## Backend

El backend user-facing debe usar Drizzle contra Postgres para:
- control de transacciones
- typing explicito
- performance
- migraciones versionadas
- menor acoplamiento al SDK

## Frontend Directo A Supabase

Si el frontend accede directo a Supabase:
- RLS es obligatoria
- policies deben testearse
- nunca exponer service role

## Service Role

`SUPABASE_SERVICE_ROLE_KEY` puede bypassar RLS. Tratarla como credencial altamente
privilegiada:
- no enviarla al browser
- evitarla en procesos user-facing salvo necesidad clara
- preferir jobs/admin workers separados

## AuthZ

RLS no reemplaza reglas de negocio del backend. Application/domain decide permisos,
limites de plan y ownership. RLS ayuda como defensa en profundidad.
