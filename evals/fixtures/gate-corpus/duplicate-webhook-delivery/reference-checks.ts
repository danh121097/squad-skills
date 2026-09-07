import { type Check, expectEqual } from '../check.ts';

interface WebhookSubject {
  handleWebhook(store: TestStore, eventId: string, amount: number): Promise<void>;
}

/**
 * `claim` is the atomic primitive the real store provides: its read and its
 * write happen in one synchronous run, before the returned promise settles, so
 * a second caller cannot slip between them. `hasProcessed` and `markProcessed`
 * are the same state reached through two awaits — correct on their own, and a
 * race the moment a handler uses them as a pair.
 */
class TestStore {
  charges: number[] = [];
  private readonly processed = new Set<string>();

  async charge(amount: number): Promise<void> {
    this.charges.push(amount);
  }

  async claim(eventId: string): Promise<boolean> {
    if (this.processed.has(eventId)) return false;

    this.processed.add(eventId);

    return true;
  }

  async hasProcessed(eventId: string): Promise<boolean> {
    return this.processed.has(eventId);
  }

  async markProcessed(eventId: string): Promise<void> {
    this.processed.add(eventId);
  }
}

export function defineChecks(subject: WebhookSubject): Check[] {
  return [
    {
      name: 'first-delivery-charges',
      run: async () => {
        const store = new TestStore();

        await subject.handleWebhook(store, 'evt_1', 2500);

        expectEqual(store.charges, [2500], 'one delivery');
      },
    },
    {
      // The redelivery a reader thinks of first, and the one a weak test stops
      // at. The buggy handler passes it: the second call starts after the first
      // has finished recording.
      name: 'sequential-redelivery-charges-once',
      run: async () => {
        const store = new TestStore();

        await subject.handleWebhook(store, 'evt_1', 2500);
        await subject.handleWebhook(store, 'evt_1', 2500);

        expectEqual(store.charges, [2500], 'delivered twice, one after the other');
      },
    },
    {
      // The provider retries on timeout, so the retry can arrive while the
      // first delivery is still in the handler. Only this ordering separates a
      // claim from a read followed by a write.
      name: 'concurrent-redelivery-charges-once',
      run: async () => {
        const store = new TestStore();

        await Promise.all([
          subject.handleWebhook(store, 'evt_1', 2500),
          subject.handleWebhook(store, 'evt_1', 2500),
        ]);

        expectEqual(store.charges, [2500], 'delivered twice, both in flight');
      },
    },
    {
      name: 'distinct-events-both-charge',
      run: async () => {
        const store = new TestStore();

        await subject.handleWebhook(store, 'evt_1', 2500);
        await subject.handleWebhook(store, 'evt_2', 400);

        expectEqual(store.charges, [2500, 400], 'two events');
      },
    },
  ];
}
