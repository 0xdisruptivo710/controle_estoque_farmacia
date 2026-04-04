import type { DomainEvent } from './DomainEvent';
import type { ReminderChannel } from '../entities/Reminder';

// ── Payload ──────────────────────────────────────────────────

export interface ReminderScheduledPayload {
  readonly pharmacyId: string;
  readonly customerId: string;
  readonly orderId?: string;
  readonly productId?: string;
  readonly scheduledDate: Date;
  readonly channel: ReminderChannel;
}

// ── Event ────────────────────────────────────────────────────

export class ReminderScheduled
  implements DomainEvent<ReminderScheduledPayload>
{
  readonly eventName = 'reminder.scheduled' as const;

  constructor(
    readonly id: string,
    readonly occurredAt: Date,
    readonly aggregateId: string,
    readonly payload: ReminderScheduledPayload,
  ) {
    Object.freeze(this);
  }

  static create(
    id: string,
    aggregateId: string,
    payload: ReminderScheduledPayload,
  ): ReminderScheduled {
    return new ReminderScheduled(id, new Date(), aggregateId, payload);
  }
}
