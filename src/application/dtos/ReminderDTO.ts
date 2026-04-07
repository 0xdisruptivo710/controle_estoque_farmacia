export type ReminderStatus = 'scheduled' | 'sent' | 'viewed' | 'converted' | 'ignored' | 'cancelled';
export type ReminderChannel = 'push' | 'whatsapp';

export interface ScheduleReminderDTO {
  pharmacyId: string;
  customerId: string;
  orderId?: string;
  productId?: string;
  scheduledDate: string;
  channel: ReminderChannel;
  messageTemplateId?: string;
  customMessage?: string;
  createdBy?: string;
}

export interface UpdateReminderDTO {
  status?: ReminderStatus;
  channel?: ReminderChannel;
  scheduledDate?: string;
  customMessage?: string;
  notes?: string;
}

export interface ReminderResponseDTO {
  id: string;
  pharmacyId: string;
  customerId: string;
  customerName: string;
  customerWhatsapp?: string;
  customerEmail?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  scheduledDate: string;
  status: ReminderStatus;
  channel: ReminderChannel;
  messageTemplateId?: string;
  customMessage?: string;
  sentAt?: string;
  openedAt?: string;
  convertedAt?: string;
  retryCount: number;
  lastError?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderListResponseDTO {
  data: ReminderResponseDTO[];
  total: number;
  overdue: number;
  today: number;
  upcoming: number;
}

export interface SendRemindersResultDTO {
  count: number;
  sent: number;
  failed: number;
  errors: Array<{ reminderId: string; error: string }>;
}
