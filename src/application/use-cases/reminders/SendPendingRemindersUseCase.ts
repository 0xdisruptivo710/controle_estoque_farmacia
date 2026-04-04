import type { IReminderRepository } from '@/domain/repositories/IReminderRepository';
import type { SendRemindersResultDTO, ReminderResponseDTO } from '@/application/dtos/ReminderDTO';

export interface INotificationService {
  sendWhatsApp(to: string, message: string): Promise<{ providerId: string }>;
  sendEmail(to: string, subject: string, body: string): Promise<{ providerId: string }>;
  sendPush(endpoint: string, payload: string): Promise<{ providerId: string }>;
}

export class SendPendingRemindersUseCase {
  constructor(
    private readonly reminderRepo: IReminderRepository,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(input: { date: Date }): Promise<SendRemindersResultDTO> {
    const dateStr = input.date.toISOString().split('T')[0];
    const pending = await this.reminderRepo.findPendingByDate(dateStr);

    const errors: Array<{ reminderId: string; error: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const reminder of pending) {
      try {
        await this.sendReminder(reminder);
        await this.reminderRepo.updateStatus(reminder.id, 'sent', {
          sentAt: new Date().toISOString(),
        });
        sent++;
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        errors.push({ reminderId: reminder.id, error: message });
        await this.reminderRepo.updateStatus(reminder.id, 'scheduled', {
          lastError: message,
          retryCount: reminder.retryCount + 1,
        });
      }
    }

    return { count: pending.length, sent, failed, errors };
  }

  private async sendReminder(reminder: ReminderResponseDTO): Promise<void> {
    const message = reminder.customMessage ?? this.buildDefaultMessage(reminder);

    switch (reminder.channel) {
      case 'whatsapp':
        if (!reminder.customerWhatsapp) {
          throw new Error('Cliente não possui WhatsApp cadastrado.');
        }
        await this.notificationService.sendWhatsApp(reminder.customerWhatsapp, message);
        break;
      case 'email':
        if (!reminder.customerEmail) {
          throw new Error('Cliente não possui e-mail cadastrado.');
        }
        await this.notificationService.sendEmail(
          reminder.customerEmail,
          `Lembrete de Recompra - ${reminder.productName ?? 'Produto'}`,
          message,
        );
        break;
      case 'push':
        await this.notificationService.sendPush('broadcast', message);
        break;
      default:
        throw new Error(`Canal não suportado: ${reminder.channel}`);
    }
  }

  private buildDefaultMessage(reminder: ReminderResponseDTO): string {
    return `Olá, ${reminder.customerName}! Está na hora de renovar seu ${reminder.productName ?? 'produto'}. Entre em contato para garantir a continuidade do seu tratamento.`;
  }
}
