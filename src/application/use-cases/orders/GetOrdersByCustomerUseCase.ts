import type { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import type { OrderListResponseDTO } from '@/application/dtos/OrderDTO';

interface GetOrdersByCustomerInput {
  customerId: string;
  page?: number;
  limit?: number;
  status?: string;
}

export class GetOrdersByCustomerUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(input: GetOrdersByCustomerInput): Promise<OrderListResponseDTO> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const result = await this.orderRepo.findByCustomer(input.customerId, {
      page,
      limit,
      status: input.status,
    });

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
    };
  }
}
