// ── Types ────────────────────────────────────────────────────

export type AlertLevel = 'ok' | 'warning' | 'critical';

export interface StockItemProps {
  id: string;
  pharmacyId: string;
  productId: string;
  lotNumber?: string;
  quantity: number;
  unitCost?: number;
  expirationDate?: Date;
  location?: string;
  alertLevel: AlertLevel;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ── Entity ───────────────────────────────────────────────────

export class StockItem {
  private readonly props: StockItemProps;

  private constructor(props: StockItemProps) {
    this.props = { ...props };
  }

  // ── Getters ──────────────────────────────────────────────

  get id(): string {
    return this.props.id;
  }

  get pharmacyId(): string {
    return this.props.pharmacyId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get lotNumber(): string | undefined {
    return this.props.lotNumber;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitCost(): number | undefined {
    return this.props.unitCost;
  }

  get expirationDate(): Date | undefined {
    return this.props.expirationDate;
  }

  get location(): string | undefined {
    return this.props.location;
  }

  get alertLevel(): AlertLevel {
    return this.props.alertLevel;
  }

  get notes(): string | undefined {
    return this.props.notes;
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

  get isEmpty(): boolean {
    return this.props.quantity <= 0;
  }

  get isCritical(): boolean {
    return this.props.alertLevel === 'critical';
  }

  get isWarning(): boolean {
    return this.props.alertLevel === 'warning';
  }

  /**
   * Returns true if the lot has an expiration date and it has already passed.
   */
  isExpired(referenceDate?: Date): boolean {
    if (!this.props.expirationDate) return false;
    const today = referenceDate ?? new Date();
    return this.props.expirationDate <= today;
  }

  /**
   * Returns true if the lot will expire within the given number of days.
   */
  expiresWithinDays(days: number, referenceDate?: Date): boolean {
    if (!this.props.expirationDate) return false;
    const ref = referenceDate ?? new Date();
    const threshold = new Date(ref);
    threshold.setDate(threshold.getDate() + days);
    return this.props.expirationDate <= threshold;
  }

  /**
   * Computes the alert level based on current quantity and the product's minimum stock.
   */
  computeAlertLevel(minimumStock: number): AlertLevel {
    if (this.props.quantity <= 0) return 'critical';
    if (this.props.quantity <= minimumStock) return 'warning';
    return 'ok';
  }

  /**
   * Creates a new StockItem with adjusted quantity.
   * The caller is responsible for validating business rules (e.g. no negative stock).
   */
  adjustQuantity(delta: number, minimumStock: number): StockItem {
    const newQty = this.props.quantity + delta;
    const newLevel = (() => {
      if (newQty <= 0) return 'critical' as const;
      if (newQty <= minimumStock) return 'warning' as const;
      return 'ok' as const;
    })();

    return StockItem.create({
      ...this.props,
      quantity: newQty,
      alertLevel: newLevel,
      updatedAt: new Date(),
    });
  }

  softDelete(): StockItem {
    return StockItem.create({
      ...this.props,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /** Returns a plain object snapshot of all properties. */
  toProps(): StockItemProps {
    return { ...this.props };
  }

  // ── Factory ──────────────────────────────────────────────

  static create(props: StockItemProps): StockItem {
    if (!props.id) throw new Error('StockItem id is required.');
    if (!props.pharmacyId) throw new Error('StockItem pharmacyId is required.');
    if (!props.productId) throw new Error('StockItem productId is required.');
    return new StockItem(props);
  }
}
