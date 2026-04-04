import type { IReminderRepository } from '@/domain/repositories/IReminderRepository';
import type { ScheduleReminderDTO, ReminderResponseDTO } from '@/application/dtos/ReminderDTO';

export class ScheduleReminderUseCase {
  constructor(private readonly reminderRepo: IReminderRepository) {}

  async execute(dto: ScheduleReminderDTO): Promise<ReminderResponseDTO> {
    const scheduledDate = new Date(dto.scheduledDate);
    if (scheduledDate < new Date()) {
      throw new Error('A data do lembrete não pode estar no passado.');
    }

    const reminder = await this.reminderRepo.create({
      pharmacyId: dto.pharmacyId,
      customerId: dto.customerId,
      orderId: dto.orderId,
      productId: dto.productId,
      scheduledDate: dto.scheduledDate,
      status: 'scheduled',
      channel: dto.channel,
      messageTemplateId: dto.messageTemplateId,
      customMessage: dto.customMessage,
      createdBy: dto.createdBy,
    });

    return reminder;
  }
}
