import { Resend } from 'resend';

export class ResendEmailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@pharmacontrol.com';
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<{ providerId: string }> {
    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject,
      html: body,
    });

    if (error) {
      throw new Error(`Falha ao enviar e-mail: ${error.message}`);
    }

    return { providerId: data?.id ?? '' };
  }
}
