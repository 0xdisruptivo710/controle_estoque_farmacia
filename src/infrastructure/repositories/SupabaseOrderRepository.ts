import type { SupabaseClient } from '@supabase/supabase-js';
import type { IOrderRepository, OrderFilters } from '@/domain/repositories/IOrderRepository';
import type { OrderResponseDTO } from '@/application/dtos/OrderDTO';

export class SupabaseOrderRepository implements IOrderRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<OrderResponseDTO | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, customers(full_name), order_items(*, products(name))')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.toDTO(data);
  }

  async findByPharmacy(
    pharmacyId: string,
    filters: OrderFilters,
  ): Promise<{ data: OrderResponseDTO[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('orders')
      .select('*, customers(full_name), order_items(*, products(name))', { count: 'exact' })
      .eq('pharmacy_id', pharmacyId)
      .is('deleted_at', null)
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map(this.toDTO),
      total: count ?? 0,
    };
  }

  async findByCustomer(
    customerId: string,
    filters: { page?: number; limit?: number; status?: string },
  ): Promise<{ data: OrderResponseDTO[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('orders')
      .select('*, customers(full_name), order_items(*, products(name))', { count: 'exact' })
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map(this.toDTO),
      total: count ?? 0,
    };
  }

  async create(input: {
    pharmacyId: string;
    customerId: string;
    prescribingDoctor?: string;
    prescriptionNumber?: string;
    estimatedReadyDate?: string;
    paymentMethod?: string;
    subtotal: number;
    discount: number;
    totalAmount: number;
    notes?: string;
    internalNotes?: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      dosage?: string;
      posology?: string;
      notes?: string;
    }>;
    createdBy: string;
  }): Promise<OrderResponseDTO> {
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        pharmacy_id: input.pharmacyId,
        customer_id: input.customerId,
        prescribing_doctor: input.prescribingDoctor,
        prescription_number: input.prescriptionNumber,
        estimated_ready_date: input.estimatedReadyDate,
        payment_method: input.paymentMethod,
        subtotal: input.subtotal,
        discount: input.discount,
        total_amount: input.totalAmount,
        notes: input.notes,
        internal_notes: input.internalNotes,
        created_by: input.createdBy,
      })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    if (input.items.length > 0) {
      const { error: itemsError } = await this.supabase
        .from('order_items')
        .insert(
          input.items.map((item) => ({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            dosage: item.dosage,
            posology: item.posology,
            notes: item.notes,
          })),
        );

      if (itemsError) throw new Error(itemsError.message);
    }

    const result = await this.findById(order.id);
    if (!result) throw new Error('Falha ao recuperar pedido criado.');
    return result;
  }

  async updateStatus(
    id: string,
    input: { status: string; updatedBy: string; deliveredAt?: string },
  ): Promise<OrderResponseDTO> {
    const updates: Record<string, unknown> = {
      status: input.status,
      updated_by: input.updatedBy,
    };

    if (input.deliveredAt) {
      updates.delivered_at = input.deliveredAt;
    }

    const { error } = await this.supabase
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(error.message);

    const result = await this.findById(id);
    if (!result) throw new Error('Pedido não encontrado após atualização.');
    return result;
  }

  private toDTO(row: Record<string, unknown>): OrderResponseDTO {
    const customer = row.customers as Record<string, unknown> | null;
    const items = (row.order_items as Array<Record<string, unknown>>) ?? [];

    return {
      id: row.id as string,
      pharmacyId: row.pharmacy_id as string,
      customerId: row.customer_id as string,
      customerName: (customer?.full_name as string) ?? '',
      orderNumber: row.order_number as string,
      status: row.status as OrderResponseDTO['status'],
      orderDate: row.order_date as string,
      estimatedReadyDate: row.estimated_ready_date as string | undefined,
      deliveredAt: row.delivered_at as string | undefined,
      prescribingDoctor: row.prescribing_doctor as string | undefined,
      prescriptionNumber: row.prescription_number as string | undefined,
      subtotal: row.subtotal as number,
      discount: row.discount as number,
      totalAmount: row.total_amount as number,
      paymentMethod: row.payment_method as string | undefined,
      notes: row.notes as string | undefined,
      internalNotes: row.internal_notes as string | undefined,
      items: items.map((item) => {
        const product = item.products as Record<string, unknown> | null;
        return {
          id: item.id as string,
          productId: item.product_id as string,
          productName: (product?.name as string) ?? '',
          quantity: item.quantity as number,
          unitPrice: item.unit_price as number,
          totalPrice: item.total_price as number,
          dosage: item.dosage as string | undefined,
          posology: item.posology as string | undefined,
          notes: item.notes as string | undefined,
        };
      }),
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
