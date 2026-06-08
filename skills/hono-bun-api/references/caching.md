# Caching

No agregar Redis por default. Cachear después de medir y con invalidación definida.

## Orden Recomendado

1. Optimizar query e índice.
2. Reducir payload.
3. Evitar N+1.
4. Per-request memoization si se repite una lectura en el mismo request.
5. HTTP cache para reads públicas/estables.
6. Cache compartida (Redis, Upstash, etc.) si el patrón lo justifica.

## Cuándo Cachear

- reads caras y frecuentes
- datos estables
- catálogos/config pública
- resultados agregados con tolerancia a stale data

No cachear:

- datos con permisos finos difíciles de modelar
- respuestas con PII
- resultados que deben ser read-your-writes
- errores transitorios por mucho tiempo

## Invalidación

Antes de implementar cache, definir:

- key
- TTL
- quién invalida
- qué pasa con writes concurrentes
- qué stale data es aceptable

## Per-Request Memoization

Útil para evitar leer lo mismo varias veces dentro de un request:

```ts
const cache = new Map<string, Promise<unknown>>();

const once = <T>(key: string, load: () => Promise<T>) => {
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key) as Promise<T>;
};
```

Mantenerlo request-scoped. No mezclar permisos entre usuarios.

## Anti-Patrones

- Redis para tapar una query sin índice
- cache sin invalidación
- keys que no incluyen tenant/actor cuando corresponde
- cachear payloads enormes
- TTL largo para datos sensibles o muy cambiantes
