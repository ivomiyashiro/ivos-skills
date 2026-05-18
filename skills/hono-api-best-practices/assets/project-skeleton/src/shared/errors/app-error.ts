/**
 * AppError — tagged union de errores de negocio que cruzan el boundary HTTP.
 *
 * Cada handler retorna Result<T, AppError>. Nunca se lanza un AppError; se retorna.
 * El mapper to-http.ts traduce cada kind a un status HTTP exhaustivamente.
 */

export type ValidationIssue = {
  path: string;
  message: string;
};

export type AppError =
  | { kind: 'NotFound'; resource: string; id: string }
  | { kind: 'Unauthorized'; reason?: string }
  | { kind: 'Forbidden'; reason?: string }
  | { kind: 'Validation'; issues: ValidationIssue[] }
  | { kind: 'Conflict'; reason: string }
  | { kind: 'Unknown'; cause?: unknown };

export const notFound = (resource: string, id: string): AppError => ({
  kind: 'NotFound',
  resource,
  id,
});

export const unauthorized = (reason?: string): AppError => ({
  kind: 'Unauthorized',
  reason,
});

export const forbidden = (reason?: string): AppError => ({
  kind: 'Forbidden',
  reason,
});

export const validation = (issues: ValidationIssue[]): AppError => ({
  kind: 'Validation',
  issues,
});

export const conflict = (reason: string): AppError => ({
  kind: 'Conflict',
  reason,
});

export const unknown = (cause?: unknown): AppError => ({
  kind: 'Unknown',
  cause,
});
