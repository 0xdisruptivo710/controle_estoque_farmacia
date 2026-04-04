type EventHandler = (event: DomainEvent) => Promise<void>;

interface DomainEvent {
  id: string;
  type: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, unknown>;
}

export class EventBusService {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.allSettled(handlers.map((handler) => handler(event)));
  }
}

export const eventBus = new EventBusService();
