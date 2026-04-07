const DEFAULT_API_URL = 'https://api.wts.chat/v1';

interface FlwChatConfig {
  apiUrl?: string;
  apiToken: string;
  fromPhone?: string | null;
}

export class FlwChatWhatsAppService {
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly fromPhone: string | null;

  /**
   * Accepts config directly (from pharmacy settings) or falls back to env vars.
   */
  constructor(config?: FlwChatConfig) {
    this.apiUrl = (
      config?.apiUrl ?? process.env.FLWCHAT_API_URL ?? DEFAULT_API_URL
    ).replace(/\/+$/, '');
    this.apiToken = config?.apiToken ?? process.env.FLWCHAT_API_TOKEN ?? '';
    this.fromPhone = config?.fromPhone ?? null;
  }

  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  }

  /**
   * Envia mensagem de texto via WhatsApp usando a API WTS/Aios.
   * O campo `from` usa o numero configurado na farmacia.
   */
  async sendWhatsApp(
    to: string,
    message: string,
  ): Promise<{ providerId: string }> {
    const formattedTo = this.formatPhone(to);
    const from = this.fromPhone ? this.formatPhone(this.fromPhone) : null;

    const response = await fetch(`${this.apiUrl}/message/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        from,
        to: formattedTo,
        body: { text: message },
        options: {},
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `WTS: falha ao enviar WhatsApp para ${formattedTo} — HTTP ${response.status}: ${errorBody}`,
      );
    }

    const data = await response.json();
    return { providerId: data.id ?? data.messageId ?? '' };
  }

  async getMessageStatus(
    messageId: string,
  ): Promise<{ status: string }> {
    const response = await fetch(
      `${this.apiUrl}/message/${messageId}/status`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiToken}` },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `WTS: falha ao consultar status — HTTP ${response.status}: ${errorBody}`,
      );
    }

    const data = await response.json();
    return { status: data.status ?? 'unknown' };
  }

  async listTemplates(): Promise<Array<Record<string, unknown>>> {
    const response = await fetch(`${this.apiUrl}/template`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.apiToken}` },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `WTS: falha ao listar templates — HTTP ${response.status}: ${errorBody}`,
      );
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data ?? [];
  }
}
