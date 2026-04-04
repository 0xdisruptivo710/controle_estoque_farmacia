import type { SupabaseClient } from '@supabase/supabase-js';
import type { IReminderRepository } from '@/domain/repositories/IReminderRepository';
import type { ReminderResponseDTO } from '@/application/dtos/ReminderDTO';

export class SupabaseReminderRepository implements IReminderRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<ReminderResponseDTO | null> {
    const { data, error } = await this.supabase
      .from('repurchase_reminders')
      .select('*, customers(full_name, whatsapp, email), products(name)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.toDTO(data);
  }

  async findByPharmacy(
    pharmacyId: string,
    filters: { status?: string; page?: number; limit?: number },
  ): Promise<{ data: ReminderResponseDTO[]; total: number; overdue: number; today: number; upcoming: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;
    const today = new Date().toISOString().split('T')[0];

    let query = this.supabase
      .from('repurchase_reminders')
      .select('*, customers(full_name, whatsapp, email), products(name)', { count: 'exact' })
      .eq('pharmacy_id', pharmacyId)
      .is('deleted_at', null)
      .order('scheduled_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const all = (data ?? []).map(this.toDTO);

    const { count: overdueCount } = await this.supabase
      .from('repurchase_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'scheduled')
      .lt('scheduled_date', today)
      .is('deleted_at', null);

    const { count: todayCount } = await this.supabase
      .from('repurchase_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'scheduled')
      .eq('scheduled_date', today)
      .is('deleted_at', null);

    const { count: upcomingCount } = await this.supabase
      .from('repurchase_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'scheduled')
      .gt('scheduled_date', today)
      .is('deleted_at', null);

    return {
      data: all,
      total: count ?? 0,
      overdue: overdueCount ?? 0,
      today: todayCount ?? 0,
      upcoming: upcomingCount ?? 0,
    };
  }

  async findPendingByDate(date: string): Promise<ReminderResponseDTO[]> {
    const { data, error } = await this.supabase
      .from('repurchase_reminders')
      .select('*, customers(full_name, whatsapp, email), products(name)')
      .eq('status', 'scheduled')
      .lte('scheduled_date', date)
      .is('deleted_at', null)
      .order('scheduled_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.toDTO);
  }

  async create(input: {
    pharmacyId: string;
    customerId: string;
    orderId?: string;
    productId?: string;
    scheduledDate: string;
    status: string;
    channel: string;
    messageTemplateId?: string;
    customMessage?: string;
    createdBy?: string;
  }): Promise<ReminderResponseDTO> {
    const { data, error } = await this.supabase
      .from('repurchase_reminders')
      .insert({
        pharmacy_id: input.pharmacyId,
        customer_id: input.customerId,
        order_id: input.orderId,
        product_id: input.productId,
        scheduled_date: input.scheduledDate,
        status: input.status,
        channel: input.channel,
        message_template_id: input.messageTemplateId,
        custom_message: input.customMessage,
        created_by: input.createdBy,
      })
      .select('*, customers(full_name, whatsapp, email), products(name)')
      .single();

    if (error) throw new Error(error.message);
    return this.toDTO(data);
  }

  async updateStatus(
    id: string,
    status: string,
    extras?: { sentAt?: string; lastError?: string; retryCount?: number },
  ): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (extras?.sentAt) updates.sent_at = extras.sentAt;
    if (extras?.lastError) updates.last_error = extras.lastError;
    if (extras?.retryCount !== undefined) updates.retry_count = extras.retryCount;

    const { error } = await this.supabase
      .from('repurchase_reminders')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  private toDTO(row: Record<string, unknown>): ReminderResponseDTO {
    const customer = row.customers as Record<string, unknown> | null;
    const product = row.products as Record<string, unknown> | null;

    return {
      id: row.id as string,
      pharmacyId: row.pharmacy_id as string,
      customerId: row.customer_id as string,
      customerName: (customer?.full_name as string) ?? '',
      customerWhatsapp: customer?.whatsapp as string | undefined,
      customerEmail: customer?.email as string | undefined,
      orderId: row.order_id as string | undefined,
      productId: row.product_id as string | undefined,
      productName: product?.name as string | undefined,
      scheduledDate: row.scheduled_date as string,
      status: row.status as ReminderResponseDTO['status'],
      channel: row.channel as ReminderResponseDTO['channel'],
      messageTemplateId: row.message_template_id as string | undefined,
      customMessage: row.custom_message as string | undefined,
      sentAt: row.sent_at as string | undefined,
      openedAt: row.opened_at as string | undefined,
      convertedAt: row.converted_at as string | undefined,
      retryCount: (row.retry_count as number) ?? 0,
      lastError: row.last_error as string | undefined,
      notes: row.notes as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
