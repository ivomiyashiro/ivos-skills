import pino, { type Logger, type LoggerOptions } from 'pino';
import { env } from '@shared/config/env';

/**
 * Logger base. En dev usamos pino-pretty para legibilidad; en prod JSON estructurado.
 * Cada request genera un child logger con requestId via el middleware logger.ts.
 */
export const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: { service: 'api', env: env.NODE_ENV },
  redact: {
    paths: [
      'auth',
      'authorization',
      'cookie',
      'token',
      'accessToken',
      'refreshToken',
      'password',
      'connectionString',
      'databaseUrl',
      'DATABASE_URL',
      '*.auth',
      '*.authorization',
      '*.cookie',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.password',
      '*.connectionString',
      '*.databaseUrl',
      'headers.authorization',
      'headers.cookie',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
  },
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss.l' },
    },
  }),
};

export const baseLogger: Logger = pino(loggerOptions);

export type { Logger };
