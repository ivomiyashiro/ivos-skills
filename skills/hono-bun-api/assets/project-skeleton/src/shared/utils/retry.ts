export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const retry = async <T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (err) {
      lastError = err;
      const canRetry = options.shouldRetry?.(err, attempt) ?? true;
      if (!canRetry || attempt >= options.retries) break;

      const exponentialDelay = options.baseDelayMs * 2 ** attempt;
      const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs ?? exponentialDelay);
      await sleep(cappedDelay);
    }
  }

  throw lastError;
};
