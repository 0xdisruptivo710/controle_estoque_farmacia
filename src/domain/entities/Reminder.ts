// ── Types ────────────────────────────────────────────────────

export type ReminderStatus =
  | 'scheduled'
  | 'sent'
  | 'viewed'
  | 'converted'
  | 'ignored'
  | 'cancelled';

export type ReminderChannel = 'push' | 'whatsapp';

export interface ReminderProps {
  id: string;
  pharmacyId: string;
  customerId: string;
  orderId?: string;
  productId?: string;
  scheduledDate: Date;
  status: ReminderStatus;
  channel: ReminderChannel;
  messageTemplateId?: string;
  customMessage?: string;
  sentAt?: Date;
  openedAt?: Date;
  convertedAt?: Date;
  conversionOrderId?: string;
  retryCount: number;
  lastError?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ── Valid status transitions ─────────────────────────────────

const VALID_TRANSITIONS: Record<ReminderStatus, ReminderStatus[]> = {
  scheduled: ['sent', 'cancelled'],
  sent: ['viewed', 'ignored', 'converted', 'cancelled'],
  viewed: ['converted', 'ignored', 'cancelled'],
  converted: [],
  ignored: ['scheduled'],   // can be re-scheduled
  cancelled: ['scheduled'], // can be re-scheduled
};

// ── Entity ───────────────────────────────────────────────────

export class Reminder {
  private readonly props: ReminderProps;

  private constructor(props: ReminderProps) {
    this.props = { ...props };
  }

  // ── Getters ──────────────────────────────────────────────

  get id(): string {
    return this.props.id;
  }

  get pharmacyId(): string {
    return this.props.pharmacyId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get orderId(): string | undefined {
    return this.props.orderId;
  }

  get productId(): string | undefined {
    return this.props.productId;
  }

  get scheduledDate(): Date {
    return this.props.scheduledDate;
  }

  get status(): ReminderStatus {
    return this.props.status;
  }

  get channel(): ReminderChannel {
    return this.props.channel;
  }

  get messageTemplateId(): string | undefined {
    return this.props.messageTemplateId;
  }

  get customMessage(): string | undefined {
    return this.props.customMessage;
  }

  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }

  get openedAt(): Date | undefined {
    return this.props.openedAt;
  }

  get convertedAt(): Date | undefined {
    return this.props.convertedAt;
  }

  get conversionOrderId(): string | undefined {
    return this.props.conversionOrderId;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  get lastError(): string | undefined {
    return this.props.lastError;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // ── Domain behaviour ─────────────────────────────────────

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  get isPending(): boolean {
    return this.props.status === 'scheduled';
  }

  get isSent(): boolean {
    return this.props.status === 'sent';
  }

  get isConverted(): boolean {
    return this.props.status === 'converted';
  }

  get isFinal(): boolean {
    return this.props.status === 'converted';
  }

  /**
   * Returns true when the scheduled date is today or in the past.
   */
  isDue(referenceDate?: Date): boolean {
    const today = referenceDate ?? new Date();
    const scheduled = new Date(this.props.scheduledDate);
    // Compare date-only (ignoring time)
    today.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    return scheduled <= today;
  }

  /**
   * Returns true when the scheduled date is strictly in the past.
   */
  isOverdue(referenceDate?: Date): boolean {
    const today = referenceDate ?? new Date();
    const scheduled = new Date(this.props.scheduledDate);
    today.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    return scheduled < today;
  }

  canTransitionTo(nextStatus: ReminderStatus): boolean {
    return VALID_TRANSITIONS[this.props.status].includes(nextStatus);
  }

  markSent(): Reminder {
    if (!this.canTransitionTo('sent')) {
      throw new Error(`Cannot mark as sent from status: ${this.props.status}.`);
    }
    return Reminder.create({
      ...this.props,
      status: 'sent',
      sentAt: new Date(),
      updatedAt: new Date(),
    });
  }

  markViewed(): Reminder {
    if (!this.canTransitionTo('viewed')) {
      throw new Error(`Cannot mark as viewed from status: ${this.props.status}.`);
    }
    return Reminder.create({
      ...this.props,
      status: 'viewed',
      openedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  markConverted(conversionOrderId: string): Reminder {
    if (!this.canTransitionTo('converted')) {
      throw new Error(`Cannot mark as converted from status: ${this.props.status}.`);
    }
    return Reminder.create({
      ...this.props,
      status: 'converted',
      convertedAt: new Date(),
      conversionOrderId,
      updatedAt: new Date(),
    });
  }

  markIgnored(): Reminder {
    if (!this.canTransitionTo('ignored')) {
      throw new Error(`Cannot mark as ignored from status: ${this.props.status}.`);
    }
    return Reminder.create({
      ...this.props,
      status: 'ignored',
      updatedAt: new Date(),
    });
  }

  cancel(): Reminder {
    if (!this.canTransitionTo('cancelled')) {
      throw new Error(`Cannot cancel from status: ${this.props.status}.`);
    }
    return Reminder.create({
      ...this.props,
      status: 'cancelled',
      updatedAt: new Date(),
    });
  }

  reschedule(newDate: Date): Reminder {
    if (!this.canTransitionTo('scheduled')) {
      throw new Error(`Cannot reschedule from status: ${this.props.status}.`);
    }
    return Reminder.create({
      ...this.props,
      status: 'scheduled',
      scheduledDate: newDate,
      retryCount: this.props.retryCount + 1,
      updatedAt: new Date(),
    });
  }

  recordError(error: string): Reminder {
    return Reminder.create({
      ...this.props,
      lastError: error,
      retryCount: this.props.retryCount + 1,
      updatedAt: new Date(),
    });
  }

  softDelete(): Reminder {
    return Reminder.create({
      ...this.props,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /** Returns a plain object snapshot of all properties. */
  toProps(): ReminderProps {
    return { ...this.props };
  }

  // ── Factory ──────────────────────────────────────────────

  static create(props: ReminderProps): Reminder {
    if (!props.id) throw new Error('Reminder id is required.');
    if (!props.pharmacyId) throw new Error('Reminder pharmacyId is required.');
    if (!props.customerId) throw new Error('Reminder customerId is required.');
    if (!props.scheduledDate) throw new Error('Reminder scheduledDate is required.');
    return new Reminder(props);
  }
}
