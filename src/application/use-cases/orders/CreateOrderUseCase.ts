import type { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import type { IStockRepository } from '@/domain/repositories/IStockRepository';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { CreateOrderDTO, OrderResponseDTO } from '@/application/dtos/OrderDTO';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly customerRepo: ICustomerRepository,
  ) {}

  async execute(dto: CreateOrderDTO): Promise<OrderResponseDTO> {
    const customer = await this.customerRepo.findById(dto.customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado.');
    }

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const totalAmount = subtotal - (dto.discount ?? 0);

    const order = await this.orderRepo.create({
      pharmacyId: dto.pharmacyId,
      customerId: dto.customerId,
      prescribingDoctor: dto.prescribingDoctor,
      prescriptionNumber: dto.prescriptionNumber,
      estimatedReadyDate: dto.estimatedReadyDate,
      paymentMethod: dto.paymentMethod,
      subtotal,
      discount: dto.discount ?? 0,
      totalAmount,
      notes: dto.notes,
      internalNotes: dto.internalNotes,
      items: dto.items,
      createdBy: dto.createdBy,
    });

    return order;
  }
}
