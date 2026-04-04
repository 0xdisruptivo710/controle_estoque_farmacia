import type { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { OrderResponseDTO } from '@/application/dtos/OrderDTO';

interface GetCustomerHistoryInput {
  customerId: string;
  page?: number;
  limit?: number;
}

interface GetCustomerHistoryOutput {
  customerName: string;
  orders: OrderResponseDTO[];
  total: number;
  page: number;
  limit: number;
}

export class GetCustomerHistoryUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(input: GetCustomerHistoryInput): Promise<GetCustomerHistoryOutput> {
    const customer = await this.customerRepo.findById(input.customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado.');
    }

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const result = await this.orderRepo.findByCustomer(input.customerId, { page, limit });

    return {
      customerName: customer.fullName,
      orders: result.data,
      total: result.total,
      page,
      limit,
    };
  }
}
