export class EvolutionWhatsAppService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly instanceName: string;

  constructor() {
    this.apiUrl = process.env.EVOLUTION_API_URL ?? '';
    this.apiKey = process.env.EVOLUTION_API_KEY ?? '';
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME ?? 'pharmacontrol';
  }

  async sendWhatsApp(
    to: string,
    message: string,
  ): Promise<{ providerId: string }> {
    const phone = to.replace(/\D/g, '');
    const number = phone.startsWith('55') ? phone : `55${phone}`;

    const response = await fetch(
      `${this.apiUrl}/message/sendText/${this.instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number: `${number}@s.whatsapp.net`,
          text: message,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Falha ao enviar WhatsApp: ${error}`);
    }

    const data = await response.json();
    return { providerId: data.key?.id ?? '' };
  }

  async checkInstanceStatus(): Promise<{ connected: boolean }> {
    const response = await fetch(
      `${this.apiUrl}/instance/connectionState/${this.instanceName}`,
      {
        headers: { apikey: this.apiKey },
      },
    );

    if (!response.ok) return { connected: false };

    const data = await response.json();
    return { connected: data.instance?.state === 'open' };
  }
}
