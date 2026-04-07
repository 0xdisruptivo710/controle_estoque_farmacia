export class FlwChatWhatsAppService {
  private readonly apiUrl: string;
  private readonly apiToken: string;

  constructor() {
    this.apiUrl = (
      process.env.FLWCHAT_API_URL ?? 'https://api.flw.chat/v1'
    ).replace(/\/+$/, '');
    this.apiToken = process.env.FLWCHAT_API_TOKEN ?? '';
  }

  /**
   * Formata o numero de telefone para o padrao FlwChat (somente digitos, com DDI 55).
   */
  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  }

  /**
   * Envia mensagem de texto via WhatsApp usando a API FlwChat.
   */
  async sendWhatsApp(
    to: string,
    message: string,
  ): Promise<{ providerId: string }> {
    const formattedPhone = this.formatPhone(to);

    const response = await fetch(`${this.apiUrl}/message/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        from: null,
        to: formattedPhone,
        body: { text: message },
        options: {},
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `FlwChat: falha ao enviar WhatsApp para ${formattedPhone} — HTTP ${response.status}: ${errorBody}`,
      );
    }

    const data = await response.json();
    return { providerId: data.id ?? data.messageId ?? '' };
  }

  /**
   * Consulta o status de uma mensagem enviada.
   */
  async getMessageStatus(
    messageId: string,
  ): Promise<{ status: string }> {
    const response = await fetch(
      `${this.apiUrl}/message/${messageId}/status`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `FlwChat: falha ao consultar status da mensagem ${messageId} — HTTP ${response.status}: ${errorBody}`,
      );
    }

    const data = await response.json();
    return { status: data.status ?? 'unknown' };
  }

  /**
   * Lista os templates disponiveis na conta FlwChat.
   * Retorno tipado como array generico para uso futuro.
   */
  async listTemplates(): Promise<Array<Record<string, unknown>>> {
    const response = await fetch(`${this.apiUrl}/template`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `FlwChat: falha ao listar templates — HTTP ${response.status}: ${errorBody}`,
      );
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data ?? [];
  }
}
