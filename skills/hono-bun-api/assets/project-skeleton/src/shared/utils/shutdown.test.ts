import { describe, expect, test } from 'bun:test';
import { shutdownGracefully } from './shutdown';

describe('shutdownGracefully', () => {
  test('stops accepting requests before waiting for active work to drain', async () => {
    const calls: string[] = [];

    await shutdownGracefully({
      stopServer: () => { calls.push('stop-server'); },
      wait: async () => { calls.push('wait'); },
      closeDb: async () => { calls.push('close-db'); },
      graceMs: 2_000,
    });

    expect(calls).toEqual(['stop-server', 'wait', 'close-db']);
  });

  test('waits for an asynchronous server stop before starting the grace period', async () => {
    const calls: string[] = [];
    let finishStop: (() => void) | undefined;

    const shutdown = shutdownGracefully({
      stopServer: () => new Promise<void>((resolve) => {
        finishStop = () => {
          calls.push('stop-server');
          resolve();
        };
      }),
      wait: async () => { calls.push('wait'); },
      closeDb: async () => { calls.push('close-db'); },
      graceMs: 2_000,
    });

    await Promise.resolve();
    expect(calls).toEqual([]);
    finishStop?.();
    await shutdown;
    expect(calls).toEqual(['stop-server', 'wait', 'close-db']);
  });
});
