import type { DomainEvent } from './DomainEvent';

// ── Payload ──────────────────────────────────────────────────

export interface OrderDeliveredPayload {
  readonly pharmacyId: string;
  readonly customerId: string;
  readonly orderNumber?: string;
  readonly deliveredAt: Date;
  readonly deliveredBy: string;
  /** Product IDs that were part of this order (used for reminder scheduling). */
  readonly productIds: ReadonlyArray<string>;
}

// ── Event ────────────────────────────────────────────────────

export class OrderDelivered implements DomainEvent<OrderDeliveredPayload> {
  readonly eventName = 'order.delivered' as const;

  constructor(
    readonly id: string,
    readonly occurredAt: Date,
    readonly aggregateId: string,
    readonly payload: OrderDeliveredPayload,
  ) {
    Object.freeze(this);
  }

  static create(
    id: string,
    aggregateId: string,
    payload: OrderDeliveredPayload,
  ): OrderDelivered {
    return new OrderDelivered(id, new Date(), aggregateId, payload);
  }
}
