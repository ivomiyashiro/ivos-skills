/**
 * Result<T, E> — discriminated union para retorno de handlers.
 *
 * Inspirado en el Result pattern de .NET (response-pattern skill). Los handlers
 * de comandos y queries jamás lanzan errores de negocio; los retornan tipados.
 */

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const success = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const failure = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Tipo helper para extraer el tipo de éxito de un Result */
export type ResultValue<R> = R extends Result<infer T, unknown> ? T : never;
/** Tipo helper para extraer el tipo de error de un Result */
export type ResultError<R> = R extends Result<unknown, infer E> ? E : never;

/** Mapea el valor exitoso. Si falla, propaga el error. */
export const mapResult = <T, U, E>(
  r: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> => (r.ok ? success(fn(r.value)) : r);

/** Encadena Results. Si falla, corto-circuita. */
export const flatMap = <T, U, E>(
  r: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => (r.ok ? fn(r.value) : r);
