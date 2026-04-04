import type { SupabaseClient } from '@supabase/supabase-js';
import type { IProductRepository, ProductFilters } from '@/domain/repositories/IProductRepository';
import type { ProductProps } from '@/domain/entities/Product';

export class SupabaseProductRepository implements IProductRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<ProductProps | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, suppliers(name)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findByPharmacy(
    pharmacyId: string,
    filters: ProductFilters,
  ): Promise<{ data: ProductProps[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('products')
      .select('*, suppliers(name)', { count: 'exact' })
      .eq('pharmacy_id', pharmacyId)
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map(this.toDomain),
      total: count ?? 0,
    };
  }

  async save(product: ProductProps): Promise<ProductProps> {
    const { data, error } = await this.supabase
      .from('products')
      .insert(this.toDatabase(product))
      .select('*, suppliers(name)')
      .single();

    if (error) throw new Error(error.message);
    return this.toDomain(data);
  }

  async update(id: string, updates: Partial<ProductProps>): Promise<ProductProps> {
    const dbUpdates: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      supplierId: 'supplier_id',
      name: 'name',
      activeIngredient: 'active_ingredient',
      code: 'code',
      barcode: 'barcode',
      category: 'category',
      unitOfMeasure: 'unit_of_measure',
      description: 'description',
      minimumStock: 'minimum_stock',
      maximumStock: 'maximum_stock',
      reorderPoint: 'reorder_point',
      repurchaseCycleDays: 'repurchase_cycle_days',
      unitCost: 'unit_cost',
      unitPrice: 'unit_price',
      isControlled: 'is_controlled',
      requiresPrescription: 'requires_prescription',
      anvisaCode: 'anvisa_code',
      isActive: 'is_active',
      imageUrl: 'image_url',
    };

    for (const [key, dbKey] of Object.entries(fieldMap)) {
      if ((updates as Record<string, unknown>)[key] !== undefined) {
        dbUpdates[dbKey] = (updates as Record<string, unknown>)[key];
      }
    }

    const { data, error } = await this.supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .select('*, suppliers(name)')
      .single();

    if (error) throw new Error(error.message);
    return this.toDomain(data);
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  private toDomain(row: Record<string, unknown>): ProductProps {
    return {
      id: row.id as string,
      pharmacyId: row.pharmacy_id as string,
      supplierId: row.supplier_id as string | undefined,
      name: row.name as string,
      activeIngredient: row.active_ingredient as string | undefined,
      code: row.code as string | undefined,
      barcode: row.barcode as string | undefined,
      category: row.category as ProductProps['category'],
      unitOfMeasure: row.unit_of_measure as string,
      description: row.description as string | undefined,
      minimumStock: (row.minimum_stock as number) ?? 0,
      maximumStock: row.maximum_stock as number | undefined,
      reorderPoint: row.reorder_point as number | undefined,
      repurchaseCycleDays: row.repurchase_cycle_days as number | undefined,
      unitCost: row.unit_cost as number | undefined,
      unitPrice: row.unit_price as number | undefined,
      isControlled: (row.is_controlled as boolean) ?? false,
      requiresPrescription: (row.requires_prescription as boolean) ?? false,
      anvisaCode: row.anvisa_code as string | undefined,
      isActive: (row.is_active as boolean) ?? true,
      imageUrl: row.image_url as string | undefined,
      createdBy: row.created_by as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
    };
  }

  private toDatabase(product: ProductProps): Record<string, unknown> {
    return {
      pharmacy_id: product.pharmacyId,
      supplier_id: product.supplierId,
      name: product.name,
      active_ingredient: product.activeIngredient,
      code: product.code,
      barcode: product.barcode,
      category: product.category,
      unit_of_measure: product.unitOfMeasure,
      description: product.description,
      minimum_stock: product.minimumStock,
      maximum_stock: product.maximumStock,
      reorder_point: product.reorderPoint,
      repurchase_cycle_days: product.repurchaseCycleDays,
      unit_cost: product.unitCost,
      unit_price: product.unitPrice,
      is_controlled: product.isControlled,
      requires_prescription: product.requiresPrescription,
      anvisa_code: product.anvisaCode,
      image_url: product.imageUrl,
      created_by: product.createdBy,
    };
  }
}
