# Code Review worked decisions

Read when severity, proof, gate outcome or AI-assisted-code critique is ambiguous. Review the real target;
do not copy these verdicts without matching evidence.

## 1. Blocking authorization bypass

**Evidence:** A route checks that the user is authenticated but loads a record by unscoped ID; another
tenant can supply that ID. A repository query pattern already scopes by tenant.

**Finding:** Blocking. Cite the handler/query lines, the cross-tenant trigger and exposed operation. Require
server-side tenant scoping and a negative integration test. `CHANGES_REQUESTED`.

**Do not dilute it to:** “Consider improving security.” The failure path and remediation are concrete.

## 2. Plausible race without proof

**Evidence:** A counter update looks non-atomic in the diff, but the reviewer cannot see whether the called
repository method uses a transaction or atomic database operation.

**Decision:** Trace the callee and run/inspect a concurrency test. If the required implementation/runtime
evidence is inaccessible, return `NEEDS_EVIDENCE` naming that method or test—do not report a confirmed race
and do not approve through uncertainty.

## 3. Real maintainability risk, not a blocker

**Evidence:** New domain behavior duplicates an existing parser in two paths. Both are currently correct,
but future contract changes can diverge.

**Finding:** Warning when the duplicated contract logic has a credible drift path; propose using the
existing owner. Keep it a suggestion when duplication is tiny, stable and abstraction would add more cost.
Do not block solely to enforce personal style.

## 4. Expand/contract migration sequencing

**Evidence:** The same release renames a populated column and removes the old field while older application
instances may still run.

**Finding:** Blocking compatibility/availability risk. Require an expand phase, compatible reads/writes,
bounded backfill, switch evidence and later contract phase, plus recovery evidence appropriate to the
target. Review both migration and deployment ordering.

## 5. AI-slop versus justified structure

**Evidence:** A new factory/interface pair has one caller and only forwards arguments, while the repository
uses direct construction for equivalent cases.

**Finding:** Warning or suggestion based on real cognitive/maintenance cost; recommend the local pattern.
Do not label code “AI-generated,” rewrite naming for taste, or remove abstractions that protect a genuine
boundary, enable testing, or already have multiple consumers.

## 6. Clean review with limited environment

**Evidence:** Diff, callers and tests are inspectable; focused static/unit checks pass; the production-like
integration environment is not required by acceptance or the changed risk surface.

**Verdict:** `APPROVE` with the checks and residual risk stated. Missing optional evidence is not automatically
`NEEDS_EVIDENCE`; use that verdict only when the missing item is required for a defensible gate decision.
