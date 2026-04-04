import webpush from 'web-push';

export class WebPushService {
  constructor() {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? 'mailto:suporte@pharmacontrol.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
      process.env.VAPID_PRIVATE_KEY ?? '',
    );
  }

  async sendPush(
    endpoint: string,
    payload: string,
    keys?: { p256dh: string; auth: string },
  ): Promise<{ providerId: string }> {
    if (endpoint === 'broadcast') {
      return { providerId: 'broadcast-skipped' };
    }

    const subscription: webpush.PushSubscription = {
      endpoint,
      keys: keys ?? { p256dh: '', auth: '' },
    };

    const result = await webpush.sendNotification(subscription, payload);
    return { providerId: String(result.statusCode) };
  }
}
