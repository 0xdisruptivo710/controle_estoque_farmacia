// ── Types ────────────────────────────────────────────────────

export type ProductCategory =
  | 'raw_material'
  | 'compound_formula'
  | 'finished_product'
  | 'packaging'
  | 'other';

export interface ProductProps {
  id: string;
  pharmacyId: string;
  supplierId?: string;
  name: string;
  activeIngredient?: string;
  code?: string;
  barcode?: string;
  category: ProductCategory;
  unitOfMeasure: string;
  description?: string;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint?: number;
  repurchaseCycleDays?: number;
  unitCost?: number;
  unitPrice?: number;
  isControlled: boolean;
  requiresPrescription: boolean;
  anvisaCode?: string;
  isActive: boolean;
  imageUrl?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ── Entity ───────────────────────────────────────────────────

export class Product {
  private readonly props: ProductProps;

  private constructor(props: ProductProps) {
    this.props = { ...props };
  }

  // ── Getters ──────────────────────────────────────────────

  get id(): string {
    return this.props.id;
  }

  get pharmacyId(): string {
    return this.props.pharmacyId;
  }

  get supplierId(): string | undefined {
    return this.props.supplierId;
  }

  get name(): string {
    return this.props.name;
  }

  get activeIngredient(): string | undefined {
    return this.props.activeIngredient;
  }

  get code(): string | undefined {
    return this.props.code;
  }

  get barcode(): string | undefined {
    return this.props.barcode;
  }

  get category(): ProductCategory {
    return this.props.category;
  }

  get unitOfMeasure(): string {
    return this.props.unitOfMeasure;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get minimumStock(): number {
    return this.props.minimumStock;
  }

  get maximumStock(): number | undefined {
    return this.props.maximumStock;
  }

  get reorderPoint(): number | undefined {
    return this.props.reorderPoint;
  }

  get repurchaseCycleDays(): number | undefined {
    return this.props.repurchaseCycleDays;
  }

  get unitCost(): number | undefined {
    return this.props.unitCost;
  }

  get unitPrice(): number | undefined {
    return this.props.unitPrice;
  }

  get isControlled(): boolean {
    return this.props.isControlled;
  }

  get requiresPrescription(): boolean {
    return this.props.requiresPrescription;
  }

  get anvisaCode(): string | undefined {
    return this.props.anvisaCode;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
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

  /** Whether this product has a repurchase cycle configured. */
  get hasRepurchaseCycle(): boolean {
    return (
      this.props.repurchaseCycleDays !== undefined && this.props.repurchaseCycleDays > 0
    );
  }

  /**
   * Calculates the next repurchase date from a given delivery date.
   * Returns undefined if no repurchase cycle is configured.
   */
  nextRepurchaseDate(deliveryDate: Date): Date | undefined {
    if (!this.hasRepurchaseCycle) return undefined;

    const next = new Date(deliveryDate);
    next.setDate(next.getDate() + (this.props.repurchaseCycleDays as number));
    return next;
  }

  activate(): Product {
    return Product.create({ ...this.props, isActive: true, updatedAt: new Date() });
  }

  deactivate(): Product {
    return Product.create({ ...this.props, isActive: false, updatedAt: new Date() });
  }

  softDelete(): Product {
    return Product.create({ ...this.props, deletedAt: new Date(), updatedAt: new Date() });
  }

  /** Returns a plain object snapshot of all properties. */
  toProps(): ProductProps {
    return { ...this.props };
  }

  // ── Factory ──────────────────────────────────────────────

  static create(props: ProductProps): Product {
    if (!props.id) throw new Error('Product id is required.');
    if (!props.pharmacyId) throw new Error('Product pharmacyId is required.');
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Product name is required.');
    }
    if (!props.unitOfMeasure || props.unitOfMeasure.trim().length === 0) {
      throw new Error('Product unitOfMeasure is required.');
    }
    if (props.minimumStock < 0) {
      throw new Error('Product minimumStock cannot be negative.');
    }
    return new Product(props);
  }
}
