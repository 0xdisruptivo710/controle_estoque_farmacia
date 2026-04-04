export type StockMovementType = 'entry' | 'exit' | 'adjustment' | 'loss' | 'expiration';
export type AlertLevel = 'ok' | 'warning' | 'critical';

export interface RegisterStockMovementDTO {
  pharmacyId: string;
  stockItemId: string;
  productId: string;
  orderId?: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number;
  reason?: string;
  referenceDoc?: string;
  performedBy: string;
}

export interface CreateStockItemDTO {
  pharmacyId: string;
  productId: string;
  lotNumber?: string;
  quantity: number;
  unitCost?: number;
  expirationDate?: string;
  location?: string;
  notes?: string;
}

export interface StockItemResponseDTO {
  id: string;
  pharmacyId: string;
  productId: string;
  productName: string;
  lotNumber?: string;
  quantity: number;
  unitCost?: number;
  expirationDate?: string;
  location?: string;
  alertLevel: AlertLevel;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockSummaryDTO {
  pharmacyId: string;
  productId: string;
  productName: string;
  unitOfMeasure: string;
  minimumStock: number;
  maximumStock?: number;
  category: string;
  totalQuantity: number;
  lotCount: number;
  nearestExpiration?: string;
  alertLevel: AlertLevel;
}

export interface StockMovementResponseDTO {
  id: string;
  stockItemId: string;
  productId: string;
  productName: string;
  orderId?: string;
  movementType: StockMovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost?: number;
  reason?: string;
  referenceDoc?: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}

export interface StockDashboardDTO {
  totalProducts: number;
  criticalAlerts: number;
  warningAlerts: number;
  expiringThisMonth: number;
  summaries: StockSummaryDTO[];
}
