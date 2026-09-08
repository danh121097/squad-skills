# Feedback records

This is the tracked evidence queue for improving Squad Skills from real use.

- `inbox/` contains redacted observations that are safe to review in Git.
- `daily/` contains sanitized daily summaries opened as draft pull requests by
  the scheduled GitHub workflow.
- `weekly/` contains sanitized weekly triage and improvement reports.
- `private/` is ignored and holds any raw local evidence needed temporarily.

Never place credentials, private source code, customer data, private evaluation
cases, full conversations, or machine-specific paths in tracked files. A public
record links an issue or uses a stable local observation ID and summarizes only
the evidence needed to reproduce the behavior safely.

An inbox item is evidence, not permission to change a skill. The weekly read
picks at most two items worth acting on and hands each to the maintainer as an
ordinary task; nothing here dispatches work or approves it. Shipping is decided
by the gate and maintainer review, as for any other change.

The local publisher may push one explicitly approved inbox item to a branch and
open a draft PR. It does not merge, publish a package, or upload the local usage
ledger.

[`docs/feedback-and-weekly-improvement.md`](../../docs/feedback-and-weekly-improvement.md)
is the full intake and cadence.
