import type { ProductProps, ProductCategory } from '../entities/Product';

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  isActive?: boolean;
  supplierId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface IProductRepository {
  findById(id: string): Promise<ProductProps | null>;
  findByPharmacy(
    pharmacyId: string,
    filters: ProductFilters,
  ): Promise<PaginatedResult<ProductProps>>;
  save(product: ProductProps): Promise<ProductProps>;
  update(id: string, data: Partial<ProductProps>): Promise<ProductProps>;
  softDelete(id: string): Promise<void>;
}
