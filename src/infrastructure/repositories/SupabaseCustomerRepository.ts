import type { SupabaseClient } from '@supabase/supabase-js';
import type { ICustomerRepository, CustomerFilters } from '@/domain/repositories/ICustomerRepository';
import type { CustomerProps } from '@/domain/entities/Customer';

export class SupabaseCustomerRepository implements ICustomerRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<CustomerProps | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findByPharmacy(
    pharmacyId: string,
    filters: CustomerFilters,
  ): Promise<{ data: CustomerProps[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('pharmacy_id', pharmacyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map(this.toDomain),
      total: count ?? 0,
    };
  }

  async findByCpf(pharmacyId: string, cpf: string): Promise<CustomerProps | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .eq('cpf', cpf)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async save(customer: CustomerProps): Promise<CustomerProps> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert(this.toDatabase(customer))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.toDomain(data);
  }

  async update(id: string, updates: Partial<CustomerProps>): Promise<CustomerProps> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.cpf !== undefined) dbUpdates.cpf = updates.cpf;
    if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.prescribingDoctor !== undefined) dbUpdates.prescribing_doctor = updates.prescribingDoctor;
    if (updates.clinicalNotes !== undefined) dbUpdates.clinical_notes = updates.clinicalNotes;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    const { data, error } = await this.supabase
      .from('customers')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.toDomain(data);
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  private toDomain(row: Record<string, unknown>): CustomerProps {
    return {
      id: row.id as string,
      pharmacyId: row.pharmacy_id as string,
      fullName: row.full_name as string,
      cpf: row.cpf as string | undefined,
      birthDate: row.birth_date ? new Date(row.birth_date as string) : undefined,
      phone: row.phone as string | undefined,
      whatsapp: row.whatsapp as string | undefined,
      email: row.email as string | undefined,
      address: row.address as Record<string, unknown> | undefined,
      gender: row.gender as string | undefined,
      prescribingDoctor: row.prescribing_doctor as string | undefined,
      clinicalNotes: row.clinical_notes as string | undefined,
      status: row.status as CustomerProps['status'],
      tags: (row.tags as string[]) ?? [],
      totalOrders: (row.total_orders as number) ?? 0,
      lastOrderAt: row.last_order_at ? new Date(row.last_order_at as string) : undefined,
      createdBy: row.created_by as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
    };
  }

  private toDatabase(customer: CustomerProps): Record<string, unknown> {
    return {
      pharmacy_id: customer.pharmacyId,
      full_name: customer.fullName,
      cpf: customer.cpf,
      birth_date: customer.birthDate?.toISOString(),
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      email: customer.email,
      address: customer.address,
      gender: customer.gender,
      prescribing_doctor: customer.prescribingDoctor,
      clinical_notes: customer.clinicalNotes,
      status: customer.status,
      tags: customer.tags,
      created_by: customer.createdBy,
    };
  }
}
