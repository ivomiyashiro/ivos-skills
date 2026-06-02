import { EventEmitter } from 'node:events';

/**
 * DomainEvent — todos los eventos del dominio se modelan así.
 * `type` es el discriminante; `payload` lo definen los modulos.
 */
export type DomainEvent<TType extends string = string, TPayload = unknown> = {
  type: TType;
  payload: TPayload;
  occurredAt: Date;
};

export type EventHandler<E extends DomainEvent = DomainEvent> = (event: E) => void | Promise<void>;

export type EventBus = ReturnType<typeof createEventBus>;

/**
 * Bus de eventos in-process. Wraps node EventEmitter pero expone solo lo necesario.
 * Patrón típico de uso:
 *   1) Commands acumulan eventos en pendingEvents.
 *   2) Después de commit, hacen bus.publish() en loop.
 *   3) Los subscribers se registran al boot (app.ts) vía bus.on().
 *
 * Para eventos durables (cross-process), evolucionar a outbox table + broker.
 */
export const createEventBus = () => {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(50);

  return {
    publish: (event: DomainEvent) => {
      emitter.emit(event.type, event);
    },
    publishMany: (events: DomainEvent[]) => {
      for (const event of events) emitter.emit(event.type, event);
    },
    on: <E extends DomainEvent>(type: E['type'], handler: EventHandler<E>) => {
      emitter.on(type, handler as EventHandler);
    },
    off: <E extends DomainEvent>(type: E['type'], handler: EventHandler<E>) => {
      emitter.off(type, handler as EventHandler);
    },
  };
};
