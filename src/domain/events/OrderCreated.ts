import type { DomainEvent } from './DomainEvent';
import type { OrderItemProps } from '../entities/Order';

// ── Payload ──────────────────────────────────────────────────

export interface OrderCreatedPayload {
  readonly pharmacyId: string;
  readonly customerId: string;
  readonly orderNumber?: string;
  readonly items: ReadonlyArray<
    Pick<OrderItemProps, 'productId' | 'quantity' | 'unitPrice'>
  >;
  readonly totalAmount: number;
  readonly createdBy: string;
}

// ── Event ────────────────────────────────────────────────────

export class OrderCreated implements DomainEvent<OrderCreatedPayload> {
  readonly eventName = 'order.created' as const;

  constructor(
    readonly id: string,
    readonly occurredAt: Date,
    readonly aggregateId: string,
    readonly payload: OrderCreatedPayload,
  ) {
    Object.freeze(this);
  }

  static create(
    id: string,
    aggregateId: string,
    payload: OrderCreatedPayload,
  ): OrderCreated {
    return new OrderCreated(id, new Date(), aggregateId, payload);
  }
}
