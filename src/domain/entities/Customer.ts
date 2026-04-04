// ── Types ────────────────────────────────────────────────────

export type CustomerStatus = 'active' | 'inactive' | 'pending_repurchase';

export interface CustomerProps {
  id: string;
  pharmacyId: string;
  fullName: string;
  cpf?: string;
  birthDate?: Date;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: Record<string, unknown>;
  gender?: string;
  prescribingDoctor?: string;
  clinicalNotes?: string;
  status: CustomerStatus;
  tags: string[];
  totalOrders: number;
  lastOrderAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ── Entity ───────────────────────────────────────────────────

export class Customer {
  private readonly props: CustomerProps;

  private constructor(props: CustomerProps) {
    this.props = { ...props };
  }

  // ── Getters ──────────────────────────────────────────────

  get id(): string {
    return this.props.id;
  }

  get pharmacyId(): string {
    return this.props.pharmacyId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get cpf(): string | undefined {
    return this.props.cpf;
  }

  get birthDate(): Date | undefined {
    return this.props.birthDate;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get whatsapp(): string | undefined {
    return this.props.whatsapp;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get address(): Record<string, unknown> | undefined {
    return this.props.address;
  }

  get gender(): string | undefined {
    return this.props.gender;
  }

  get prescribingDoctor(): string | undefined {
    return this.props.prescribingDoctor;
  }

  get clinicalNotes(): string | undefined {
    return this.props.clinicalNotes;
  }

  get status(): CustomerStatus {
    return this.props.status;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get totalOrders(): number {
    return this.props.totalOrders;
  }

  get lastOrderAt(): Date | undefined {
    return this.props.lastOrderAt;
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

  get isActive(): boolean {
    return this.props.status === 'active' && this.props.deletedAt === undefined;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  activate(): Customer {
    return Customer.create({ ...this.props, status: 'active', updatedAt: new Date() });
  }

  deactivate(): Customer {
    return Customer.create({ ...this.props, status: 'inactive', updatedAt: new Date() });
  }

  markPendingRepurchase(): Customer {
    return Customer.create({
      ...this.props,
      status: 'pending_repurchase',
      updatedAt: new Date(),
    });
  }

  registerOrderDelivery(): Customer {
    return Customer.create({
      ...this.props,
      totalOrders: this.props.totalOrders + 1,
      lastOrderAt: new Date(),
      status: 'active',
      updatedAt: new Date(),
    });
  }

  softDelete(): Customer {
    return Customer.create({ ...this.props, deletedAt: new Date(), updatedAt: new Date() });
  }

  /** Returns a plain object snapshot of all properties. */
  toProps(): CustomerProps {
    return { ...this.props, tags: [...this.props.tags] };
  }

  // ── Factory ──────────────────────────────────────────────

  static create(props: CustomerProps): Customer {
    if (!props.id) throw new Error('Customer id is required.');
    if (!props.pharmacyId) throw new Error('Customer pharmacyId is required.');
    if (!props.fullName || props.fullName.trim().length === 0) {
      throw new Error('Customer fullName is required.');
    }
    return new Customer(props);
  }
}
