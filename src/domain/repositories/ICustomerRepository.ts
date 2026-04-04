import type { CustomerProps, CustomerStatus } from '../entities/Customer';

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface ICustomerRepository {
  findById(id: string): Promise<CustomerProps | null>;
  findByPharmacy(
    pharmacyId: string,
    filters: CustomerFilters,
  ): Promise<PaginatedResult<CustomerProps>>;
  findByCpf(pharmacyId: string, cpf: string): Promise<CustomerProps | null>;
  save(customer: CustomerProps): Promise<CustomerProps>;
  update(id: string, data: Partial<CustomerProps>): Promise<CustomerProps>;
  softDelete(id: string): Promise<void>;
}
