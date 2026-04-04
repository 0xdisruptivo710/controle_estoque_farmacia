/**
 * Base interface for all domain events.
 *
 * Every event is immutable and named in the past tense
 * (e.g. OrderCreated, StockAlertTriggered).
 */
export interface DomainEvent<TPayload = unknown> {
  /** Unique identifier of this event instance. */
  readonly id: string;

  /** ISO-8601 timestamp of when the event occurred. */
  readonly occurredAt: Date;

  /** Fully-qualified event name (e.g. "order.created"). */
  readonly eventName: string;

  /** The aggregate root ID that originated this event. */
  readonly aggregateId: string;

  /** Event-specific data. */
  readonly payload: TPayload;
}
