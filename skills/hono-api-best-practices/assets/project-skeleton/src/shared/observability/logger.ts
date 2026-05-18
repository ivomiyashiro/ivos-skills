import pino, { type Logger } from 'pino';
import { env } from '@shared/config/env';

/**
 * Logger base. En dev usamos pino-pretty para legibilidad; en prod JSON estructurado.
 * Cada request genera un child logger con requestId via el middleware logger.ts.
 */
export const baseLogger: Logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'api', env: env.NODE_ENV },
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss.l' },
    },
  }),
});

export type { Logger };
