import type { IStockRepository } from '@/domain/repositories/IStockRepository';
import type { RegisterStockMovementDTO, StockMovementResponseDTO } from '@/application/dtos/StockDTO';

export class RegisterStockMovementUseCase {
  constructor(private readonly stockRepo: IStockRepository) {}

  async execute(dto: RegisterStockMovementDTO): Promise<StockMovementResponseDTO> {
    const stockItem = await this.stockRepo.findStockItemById(dto.stockItemId);
    if (!stockItem) {
      throw new Error('Item de estoque não encontrado.');
    }

    const quantityBefore = stockItem.quantity;
    let quantityAfter: number;

    switch (dto.movementType) {
      case 'entry':
        quantityAfter = quantityBefore + dto.quantity;
        break;
      case 'exit':
      case 'loss':
      case 'expiration':
        if (quantityBefore < dto.quantity) {
          throw new Error('Quantidade insuficiente em estoque.');
        }
        quantityAfter = quantityBefore - dto.quantity;
        break;
      case 'adjustment':
        quantityAfter = dto.quantity;
        break;
      default:
        throw new Error('Tipo de movimentação inválido.');
    }

    await this.stockRepo.updateStockItemQuantity(dto.stockItemId, quantityAfter);

    const movement = await this.stockRepo.registerMovement({
      ...dto,
      quantityBefore,
      quantityAfter,
    });

    return movement;
  }
}
