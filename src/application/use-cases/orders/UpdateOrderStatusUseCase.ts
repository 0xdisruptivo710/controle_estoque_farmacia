import type { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import type { UpdateOrderStatusDTO, OrderResponseDTO } from '@/application/dtos/OrderDTO';

const VALID_TRANSITIONS: Record<string, string[]> = {
  received: ['in_preparation', 'cancelled'],
  in_preparation: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(orderId: string, dto: UpdateOrderStatusDTO): Promise<OrderResponseDTO> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado.');
    }

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new Error(
        `Transição de status inválida: ${order.status} → ${dto.status}`,
      );
    }

    const updated = await this.orderRepo.updateStatus(orderId, {
      status: dto.status,
      updatedBy: dto.updatedBy,
      deliveredAt: dto.status === 'delivered' ? new Date().toISOString() : undefined,
    });

    return updated;
  }
}
