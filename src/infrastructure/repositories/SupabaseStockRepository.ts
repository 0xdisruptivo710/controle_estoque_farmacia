import type { SupabaseClient } from '@supabase/supabase-js';
import type { IStockRepository } from '@/domain/repositories/IStockRepository';
import type { StockItemProps } from '@/domain/entities/StockItem';
import type {
  StockSummaryDTO,
  StockMovementResponseDTO,
  CreateStockItemDTO,
} from '@/application/dtos/StockDTO';

export class SupabaseStockRepository implements IStockRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findStockItemById(id: string): Promise<StockItemProps | null> {
    const { data, error } = await this.supabase
      .from('stock_items')
      .select('*, products(name, minimum_stock)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.toStockItemDomain(data);
  }

  async findStockItemsByProduct(
    productId: string,
  ): Promise<StockItemProps[]> {
    const { data, error } = await this.supabase
      .from('stock_items')
      .select('*, products(name, minimum_stock)')
      .eq('product_id', productId)
      .is('deleted_at', null)
      .order('expiration_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.toStockItemDomain);
  }

  async createStockItem(dto: CreateStockItemDTO): Promise<StockItemProps> {
    const { data, error } = await this.supabase
      .from('stock_items')
      .insert({
        pharmacy_id: dto.pharmacyId,
        product_id: dto.productId,
        lot_number: dto.lotNumber,
        quantity: dto.quantity,
        unit_cost: dto.unitCost,
        expiration_date: dto.expirationDate,
        location: dto.location,
        notes: dto.notes,
      })
      .select('*, products(name, minimum_stock)')
      .single();

    if (error) throw new Error(error.message);
    return this.toStockItemDomain(data);
  }

  async updateStockItemQuantity(id: string, quantity: number): Promise<void> {
    const { error } = await this.supabase
      .from('stock_items')
      .update({ quantity })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async registerMovement(movement: {
    pharmacyId: string;
    stockItemId: string;
    productId: string;
    orderId?: string;
    movementType: string;
    quantity: number;
    quantityBefore: number;
    quantityAfter: number;
    unitCost?: number;
    reason?: string;
    referenceDoc?: string;
    performedBy: string;
  }): Promise<StockMovementResponseDTO> {
    const { data, error } = await this.supabase
      .from('stock_movements')
      .insert({
        pharmacy_id: movement.pharmacyId,
        stock_item_id: movement.stockItemId,
        product_id: movement.productId,
        order_id: movement.orderId,
        movement_type: movement.movementType,
        quantity: movement.quantity,
        quantity_before: movement.quantityBefore,
        quantity_after: movement.quantityAfter,
        unit_cost: movement.unitCost,
        reason: movement.reason,
        reference_doc: movement.referenceDoc,
        performed_by: movement.performedBy,
      })
      .select('*, products(name), profiles:performed_by(full_name)')
      .single();

    if (error) throw new Error(error.message);

    const product = data.products as Record<string, unknown> | null;
    const profile = data.profiles as Record<string, unknown> | null;

    return {
      id: data.id,
      stockItemId: data.stock_item_id,
      productId: data.product_id,
      productName: (product?.name as string) ?? '',
      orderId: data.order_id,
      movementType: data.movement_type,
      quantity: data.quantity,
      quantityBefore: data.quantity_before,
      quantityAfter: data.quantity_after,
      unitCost: data.unit_cost,
      reason: data.reason,
      referenceDoc: data.reference_doc,
      performedBy: data.performed_by,
      performedByName: (profile?.full_name as string) ?? '',
      createdAt: data.created_at,
    };
  }

  async getStockSummary(pharmacyId: string): Promise<StockSummaryDTO[]> {
    const { data, error } = await this.supabase
      .from('stock_summary')
      .select('*')
      .eq('pharmacy_id', pharmacyId);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      pharmacyId: row.pharmacy_id,
      productId: row.product_id,
      productName: row.product_name,
      unitOfMeasure: row.unit_of_measure,
      minimumStock: row.minimum_stock ?? 0,
      maximumStock: row.maximum_stock,
      category: row.category,
      totalQuantity: row.total_quantity ?? 0,
      lotCount: row.lot_count ?? 0,
      nearestExpiration: row.nearest_expiration,
      alertLevel: row.computed_alert_level ?? 'ok',
    }));
  }

  private toStockItemDomain(row: Record<string, unknown>): StockItemProps {
    return {
      id: row.id as string,
      pharmacyId: row.pharmacy_id as string,
      productId: row.product_id as string,
      lotNumber: row.lot_number as string | undefined,
      quantity: row.quantity as number,
      unitCost: row.unit_cost as number | undefined,
      expirationDate: row.expiration_date ? new Date(row.expiration_date as string) : undefined,
      location: row.location as string | undefined,
      alertLevel: (row.alert_level as StockItemProps['alertLevel']) ?? 'ok',
      notes: row.notes as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
    };
  }
}
