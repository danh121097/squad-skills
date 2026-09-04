import { type Check, expectEqual, expectThrows } from '../check.ts';

interface Ledger {
  read(account: string): number;
  stage(account: string, delta: number): void;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

interface TransferSubject {
  transfer(ledger: Ledger, from: string, to: string, amount: number): Promise<boolean>;
}

/** `rollbackFails` is the only way to observe a rollback that was never awaited. */
function buildLedger(rollbackFails: boolean): Ledger & { applied(): Record<string, number> } {
  const committed: Record<string, number> = { alice: 50, bob: 0 };
  let staged: Record<string, number> = {};

  return {
    read: (account) => (committed[account] ?? 0) + (staged[account] ?? 0),
    stage: (account, delta) => {
      staged[account] = (staged[account] ?? 0) + delta;
    },
    commit: async () => {
      for (const [account, delta] of Object.entries(staged)) {
        committed[account] = (committed[account] ?? 0) + delta;
      }

      staged = {};
    },
    rollback: () => {
      if (!rollbackFails) {
        staged = {};

        return Promise.resolve();
      }

      // The fixture attaches its own handler and hands back the same rejected
      // promise. A caller that awaits it still sees the failure; a caller that
      // drops it no longer emits an unhandled rejection, which would abort the
      // grader before it could record that the drop is the defect.
      const failure = Promise.reject(new Error('ledger unreachable'));

      failure.catch(() => {});

      return failure;
    },
    applied: () => ({ ...committed }),
  };
}

export function defineChecks(subject: TransferSubject): Check[] {
  return [
    {
      name: 'sufficient-funds-transfer',
      run: async () => {
        const ledger = buildLedger(false);

        expectEqual(await subject.transfer(ledger, 'alice', 'bob', 20), true, 'result');
        expectEqual(ledger.applied(), { alice: 30, bob: 20 }, 'balances');
      },
    },
    {
      name: 'insufficient-funds-declined',
      run: async () => {
        const ledger = buildLedger(false);

        expectEqual(await subject.transfer(ledger, 'alice', 'bob', 80), false, 'result');
        expectEqual(ledger.applied(), { alice: 50, bob: 0 }, 'balances');
      },
    },
    {
      name: 'failed-rollback-surfaces',
      run: async () => {
        const ledger = buildLedger(true);

        await expectThrows(() => subject.transfer(ledger, 'alice', 'bob', 80), 'transfer');
      },
    },
  ];
}
