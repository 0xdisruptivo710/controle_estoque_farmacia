import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { UpdateCustomerDTO, CustomerResponseDTO } from '@/application/dtos/CustomerDTO';
import { CPF } from '@/domain/value-objects/CPF';

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(id: string, dto: UpdateCustomerDTO): Promise<CustomerResponseDTO> {
    const existing = await this.customerRepo.findById(id);
    if (!existing) {
      throw new Error('Cliente não encontrado.');
    }

    if (dto.cpf && dto.cpf !== existing.cpf) {
      const cpf = CPF.create(dto.cpf);
      const duplicate = await this.customerRepo.findByCpf(existing.pharmacyId, cpf.value);
      if (duplicate && duplicate.id !== id) {
        throw new Error('Já existe um cliente com este CPF nesta farmácia.');
      }
      dto.cpf = cpf.value;
    }

    const updated = await this.customerRepo.update(id, {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      address: dto.address as Record<string, unknown>,
    });

    return {
      id: updated.id,
      pharmacyId: updated.pharmacyId,
      fullName: updated.fullName,
      cpf: updated.cpf,
      birthDate: updated.birthDate?.toISOString(),
      phone: updated.phone,
      whatsapp: updated.whatsapp,
      email: updated.email,
      address: updated.address,
      gender: updated.gender,
      prescribingDoctor: updated.prescribingDoctor,
      clinicalNotes: updated.clinicalNotes,
      status: updated.status,
      tags: updated.tags,
      totalOrders: updated.totalOrders,
      lastOrderAt: updated.lastOrderAt?.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
