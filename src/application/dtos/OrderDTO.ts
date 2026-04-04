export type OrderStatus = 'received' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  dosage?: string;
  posology?: string;
  notes?: string;
}

export interface CreateOrderDTO {
  pharmacyId: string;
  customerId: string;
  prescribingDoctor?: string;
  prescriptionNumber?: string;
  estimatedReadyDate?: string;
  paymentMethod?: string;
  discount?: number;
  notes?: string;
  internalNotes?: string;
  items: OrderItemInput[];
  createdBy: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  updatedBy: string;
  notes?: string;
}

export interface OrderItemResponseDTO {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosage?: string;
  posology?: string;
  notes?: string;
}

export interface OrderResponseDTO {
  id: string;
  pharmacyId: string;
  customerId: string;
  customerName: string;
  orderNumber: string;
  status: OrderStatus;
  orderDate: string;
  estimatedReadyDate?: string;
  deliveredAt?: string;
  prescribingDoctor?: string;
  prescriptionNumber?: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod?: string;
  notes?: string;
  internalNotes?: string;
  items: OrderItemResponseDTO[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponseDTO {
  data: OrderResponseDTO[];
  total: number;
  page: number;
  limit: number;
}
