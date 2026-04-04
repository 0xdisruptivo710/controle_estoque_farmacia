export interface CreateCustomerDTO {
  pharmacyId: string;
  fullName: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  gender?: string;
  prescribingDoctor?: string;
  clinicalNotes?: string;
  tags?: string[];
  createdBy: string;
}

export interface UpdateCustomerDTO {
  fullName?: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  gender?: string;
  prescribingDoctor?: string;
  clinicalNotes?: string;
  status?: 'active' | 'inactive' | 'pending_repurchase';
  tags?: string[];
}

export interface CustomerResponseDTO {
  id: string;
  pharmacyId: string;
  fullName: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: Record<string, unknown>;
  gender?: string;
  prescribingDoctor?: string;
  clinicalNotes?: string;
  status: 'active' | 'inactive' | 'pending_repurchase';
  tags: string[];
  totalOrders: number;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponseDTO {
  data: CustomerResponseDTO[];
  total: number;
  page: number;
  limit: number;
}
