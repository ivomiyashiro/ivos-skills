import { describe, expect, test } from 'bun:test';
import pino from 'pino';
import { loggerOptions } from './logger';

describe('loggerOptions', () => {
  test('redacts authentication, cookie, token, password, and connection string fields', () => {
    const lines: string[] = [];
    const { transport: _transport, ...options } = loggerOptions;
    const logger = pino({ ...options, level: 'info' }, {
      write: (line) => {
        lines.push(line);
        return true;
      },
    });

    logger.info({
      auth: 'secret',
      authorization: 'Bearer secret',
      cookie: 'session=secret',
      token: 'secret',
      password: 'secret',
      connectionString: 'postgresql://user:secret@db/app',
      req: { headers: { authorization: 'Bearer secret', cookie: 'session=secret' } },
      credentials: { password: 'secret' },
    }, 'sensitive fields');
    logger.flush();

    const payload = JSON.parse(lines[0] ?? '{}');
    expect(payload.auth).toBe('[Redacted]');
    expect(payload.authorization).toBe('[Redacted]');
    expect(payload.cookie).toBe('[Redacted]');
    expect(payload.token).toBe('[Redacted]');
    expect(payload.password).toBe('[Redacted]');
    expect(payload.connectionString).toBe('[Redacted]');
    expect(payload.req.headers.authorization).toBe('[Redacted]');
    expect(payload.req.headers.cookie).toBe('[Redacted]');
    expect(payload.credentials.password).toBe('[Redacted]');
  });
});
