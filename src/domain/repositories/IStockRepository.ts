import type { StockItemProps, AlertLevel } from '../entities/StockItem';
import type { StockSummaryDTO, StockMovementResponseDTO, CreateStockItemDTO } from '@/application/dtos/StockDTO';

export interface StockFilters {
  productId?: string;
  alertLevel?: AlertLevel;
  page?: number;
  limit?: number;
}

export interface IStockRepository {
  findStockItemById(id: string): Promise<StockItemProps | null>;
  findStockItemsByProduct(productId: string): Promise<StockItemProps[]>;
  createStockItem(dto: CreateStockItemDTO): Promise<StockItemProps>;
  updateStockItemQuantity(id: string, quantity: number): Promise<void>;
  registerMovement(movement: {
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
  }): Promise<StockMovementResponseDTO>;
  getStockSummary(pharmacyId: string): Promise<StockSummaryDTO[]>;
}
