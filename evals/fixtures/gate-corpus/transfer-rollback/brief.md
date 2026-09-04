# Transfer between two ledger accounts

`transfer(ledger, from, to, amount)` stages both sides of a move, then either
commits it or rolls it back. It resolves `true` when the transfer went through
and `false` when it was declined for insufficient funds.

Acceptance criteria:

- A transfer within the sender's balance commits both sides and resolves `true`.
- A transfer beyond the sender's balance is declined, leaves both balances
  unchanged, and resolves `false`.
- If the rollback itself fails, the caller learns about it rather than being told
  the transfer was cleanly declined.
