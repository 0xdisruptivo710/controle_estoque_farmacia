import type { OrderStatus } from '../entities/Order';
import type { OrderResponseDTO } from '@/application/dtos/OrderDTO';

export interface OrderFilters {
  customerId?: string;
  status?: OrderStatus | string;
  page?: number;
  limit?: number;
}

export interface IOrderRepository {
  findById(id: string): Promise<OrderResponseDTO | null>;
  findByPharmacy(
    pharmacyId: string,
    filters: OrderFilters,
  ): Promise<{ data: OrderResponseDTO[]; total: number }>;
  findByCustomer(
    customerId: string,
    filters: { page?: number; limit?: number; status?: string },
  ): Promise<{ data: OrderResponseDTO[]; total: number }>;
  create(input: {
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
  }): Promise<OrderResponseDTO>;
  updateStatus(
    id: string,
    input: { status: string; updatedBy: string; deliveredAt?: string },
  ): Promise<OrderResponseDTO>;
}
