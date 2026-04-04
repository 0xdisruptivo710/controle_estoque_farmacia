import type { ReminderStatus, ReminderChannel } from '../entities/Reminder';
import type { ReminderResponseDTO } from '@/application/dtos/ReminderDTO';

export interface ReminderFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export interface IReminderRepository {
  findById(id: string): Promise<ReminderResponseDTO | null>;
  findByPharmacy(
    pharmacyId: string,
    filters: ReminderFilters,
  ): Promise<{ data: ReminderResponseDTO[]; total: number; overdue: number; today: number; upcoming: number }>;
  findPendingByDate(date: string): Promise<ReminderResponseDTO[]>;
  create(input: {
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
  }): Promise<ReminderResponseDTO>;
  updateStatus(
    id: string,
    status: string,
    extras?: { sentAt?: string; lastError?: string; retryCount?: number },
  ): Promise<void>;
}
