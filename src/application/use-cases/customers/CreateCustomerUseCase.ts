import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { CreateCustomerDTO, CustomerResponseDTO } from '@/application/dtos/CustomerDTO';
import type { CustomerProps } from '@/domain/entities/Customer';
import { CPF } from '@/domain/value-objects/CPF';

export class CreateCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(dto: CreateCustomerDTO): Promise<CustomerResponseDTO> {
    if (dto.cpf) {
      const cpf = CPF.create(dto.cpf);
      const existing = await this.customerRepo.findByCpf(dto.pharmacyId, cpf.value);
      if (existing) {
        throw new Error('Já existe um cliente com este CPF nesta farmácia.');
      }
    }

    const customer = await this.customerRepo.save({
      id: '',
      pharmacyId: dto.pharmacyId,
      fullName: dto.fullName,
      cpf: dto.cpf ? CPF.create(dto.cpf).value : undefined,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      phone: dto.phone,
      whatsapp: dto.whatsapp,
      email: dto.email,
      address: dto.address as Record<string, unknown>,
      gender: dto.gender,
      prescribingDoctor: dto.prescribingDoctor,
      clinicalNotes: dto.clinicalNotes,
      status: 'active',
      tags: dto.tags ?? [],
      totalOrders: 0,
      createdBy: dto.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.toResponseDTO(customer);
  }

  private toResponseDTO(customer: CustomerProps): CustomerResponseDTO {
    return {
      id: customer.id,
      pharmacyId: customer.pharmacyId,
      fullName: customer.fullName,
      cpf: customer.cpf,
      birthDate: customer.birthDate?.toISOString(),
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      email: customer.email,
      address: customer.address,
      gender: customer.gender,
      prescribingDoctor: customer.prescribingDoctor,
      clinicalNotes: customer.clinicalNotes,
      status: customer.status,
      tags: customer.tags,
      totalOrders: customer.totalOrders,
      lastOrderAt: customer.lastOrderAt?.toISOString(),
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
