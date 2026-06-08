export class TimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

export const withTimeout = async <T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new TimeoutError(timeoutMs)), timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (err) {
    if (controller.signal.aborted) throw new TimeoutError(timeoutMs);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};
