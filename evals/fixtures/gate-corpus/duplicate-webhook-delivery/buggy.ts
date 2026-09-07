export interface WebhookStore {
  charge(amount: number): Promise<void>;
  claim(eventId: string): Promise<boolean>;
  hasProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
}

export async function handleWebhook(
  store: WebhookStore,
  eventId: string,
  amount: number
): Promise<void> {
  if (await store.hasProcessed(eventId)) return;

  await store.charge(amount);
  await store.markProcessed(eventId);
}
