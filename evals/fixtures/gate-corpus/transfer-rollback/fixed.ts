export interface Ledger {
  read(account: string): number;
  stage(account: string, delta: number): void;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export async function transfer(
  ledger: Ledger,
  from: string,
  to: string,
  amount: number
): Promise<boolean> {
  ledger.stage(from, -amount);
  ledger.stage(to, amount);

  if (ledger.read(from) < 0) {
    await ledger.rollback();

    return false;
  }

  await ledger.commit();

  return true;
}
