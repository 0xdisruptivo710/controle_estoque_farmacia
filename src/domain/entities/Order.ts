// ── Types ────────────────────────────────────────────────────

export type OrderStatus =
  | 'received'
  | 'in_preparation'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosage?: string;
  posology?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderProps {
  id: string;
  pharmacyId: string;
  customerId: string;
  orderNumber?: string;
  status: OrderStatus;
  orderDate: Date;
  estimatedReadyDate?: Date;
  deliveredAt?: Date;
  prescribingDoctor?: string;
  prescriptionNumber?: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod?: string;
  notes?: string;
  internalNotes?: string;
  items: OrderItemProps[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ── Valid status transitions ─────────────────────────────────

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ['in_preparation', 'cancelled'],
  in_preparation: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

// ── Entity ───────────────────────────────────────────────────

export class Order {
  private readonly props: OrderProps;

  private constructor(props: OrderProps) {
    this.props = { ...props, items: props.items.map((i) => ({ ...i })) };
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

  get orderNumber(): string | undefined {
    return this.props.orderNumber;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get orderDate(): Date {
    return this.props.orderDate;
  }

  get estimatedReadyDate(): Date | undefined {
    return this.props.estimatedReadyDate;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get prescribingDoctor(): string | undefined {
    return this.props.prescribingDoctor;
  }

  get prescriptionNumber(): string | undefined {
    return this.props.prescriptionNumber;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  get discount(): number {
    return this.props.discount;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get paymentMethod(): string | undefined {
    return this.props.paymentMethod;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get internalNotes(): string | undefined {
    return this.props.internalNotes;
  }

  get items(): ReadonlyArray<OrderItemProps> {
    return this.props.items.map((i) => ({ ...i }));
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
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

  get isDelivered(): boolean {
    return this.props.status === 'delivered';
  }

  get isCancelled(): boolean {
    return this.props.status === 'cancelled';
  }

  get isFinal(): boolean {
    return this.isDelivered || this.isCancelled;
  }

  /**
   * Returns true when the transition from the current status to `nextStatus` is allowed.
   */
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return VALID_TRANSITIONS[this.props.status].includes(nextStatus);
  }

  /**
   * Advances the order to the given status.
   *
   * @throws {Error} if the transition is not valid.
   */
  transitionTo(nextStatus: OrderStatus, updatedBy: string): Order {
    if (!this.canTransitionTo(nextStatus)) {
      throw new Error(
        `Invalid status transition: ${this.props.status} -> ${nextStatus}.`,
      );
    }

    const patch: Partial<OrderProps> = {
      status: nextStatus,
      updatedBy,
      updatedAt: new Date(),
    };

    if (nextStatus === 'delivered') {
      patch.deliveredAt = new Date();
    }

    return Order.create({ ...this.props, ...patch });
  }

  softDelete(): Order {
    return Order.create({
      ...this.props,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /** Returns a plain object snapshot of all properties. */
  toProps(): OrderProps {
    return {
      ...this.props,
      items: this.props.items.map((i) => ({ ...i })),
    };
  }

  // ── Factory ──────────────────────────────────────────────

  static create(props: OrderProps): Order {
    if (!props.id) throw new Error('Order id is required.');
    if (!props.pharmacyId) throw new Error('Order pharmacyId is required.');
    if (!props.customerId) throw new Error('Order customerId is required.');
    if (!props.createdBy) throw new Error('Order createdBy is required.');
    if (props.discount < 0) throw new Error('Order discount cannot be negative.');
    return new Order(props);
  }
}
