export type ProductCategory = 'raw_material' | 'compound_formula' | 'finished_product' | 'packaging' | 'other';

export interface CreateProductDTO {
  pharmacyId: string;
  supplierId?: string;
  name: string;
  activeIngredient?: string;
  code?: string;
  barcode?: string;
  category: ProductCategory;
  unitOfMeasure: string;
  description?: string;
  minimumStock?: number;
  maximumStock?: number;
  reorderPoint?: number;
  repurchaseCycleDays?: number;
  unitCost?: number;
  unitPrice?: number;
  isControlled?: boolean;
  requiresPrescription?: boolean;
  anvisaCode?: string;
  imageUrl?: string;
  createdBy: string;
}

export interface UpdateProductDTO {
  supplierId?: string;
  name?: string;
  activeIngredient?: string;
  code?: string;
  barcode?: string;
  category?: ProductCategory;
  unitOfMeasure?: string;
  description?: string;
  minimumStock?: number;
  maximumStock?: number;
  reorderPoint?: number;
  repurchaseCycleDays?: number;
  unitCost?: number;
  unitPrice?: number;
  isControlled?: boolean;
  requiresPrescription?: boolean;
  anvisaCode?: string;
  isActive?: boolean;
  imageUrl?: string;
}

export interface ProductResponseDTO {
  id: string;
  pharmacyId: string;
  supplierId?: string;
  supplierName?: string;
  name: string;
  activeIngredient?: string;
  code?: string;
  barcode?: string;
  category: ProductCategory;
  unitOfMeasure: string;
  description?: string;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint?: number;
  repurchaseCycleDays?: number;
  unitCost?: number;
  unitPrice?: number;
  isControlled: boolean;
  requiresPrescription: boolean;
  anvisaCode?: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
