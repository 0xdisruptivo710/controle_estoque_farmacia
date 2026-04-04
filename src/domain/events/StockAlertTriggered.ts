import type { DomainEvent } from './DomainEvent';
import type { AlertLevel } from '../entities/StockItem';

// ── Payload ──────────────────────────────────────────────────

export interface StockAlertTriggeredPayload {
  readonly pharmacyId: string;
  readonly productId: string;
  readonly productName: string;
  readonly stockItemId: string;
  readonly currentQuantity: number;
  readonly minimumStock: number;
  readonly alertLevel: AlertLevel;
  readonly lotNumber?: string;
}

// ── Event ────────────────────────────────────────────────────

export class StockAlertTriggered
  implements DomainEvent<StockAlertTriggeredPayload>
{
  readonly eventName = 'stock.alert_triggered' as const;

  constructor(
    readonly id: string,
    readonly occurredAt: Date,
    readonly aggregateId: string,
    readonly payload: StockAlertTriggeredPayload,
  ) {
    Object.freeze(this);
  }

  static create(
    id: string,
    aggregateId: string,
    payload: StockAlertTriggeredPayload,
  ): StockAlertTriggered {
    return new StockAlertTriggered(id, new Date(), aggregateId, payload);
  }
}
