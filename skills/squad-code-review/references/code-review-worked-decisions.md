# Code Review worked decisions

Read when severity, proof, gate outcome or AI-assisted-code critique is ambiguous.

## 1. Plausible race without proof

**Situation:** A counter update looks non-atomic, but the called repository method may use a transaction or
atomic operation you cannot see.

**Decision:** Trace the callee and run or inspect a concurrency test. If that evidence is inaccessible,
return `NEEDS_EVIDENCE` naming the method or test — neither an unproven race nor an approval through
uncertainty.

## 2. Duplication: warning or suggestion

**Situation:** New behavior duplicates an existing parser in two paths; both are correct today.

**Decision:** Warning when the duplicated contract logic has a credible drift path; recommend the existing
owner. Suggestion when the duplication is tiny and stable and an abstraction would cost more.

**Why:** Severity follows the drift risk, not style preference.

## 3. AI-slop versus justified structure

**Situation:** A new factory/interface pair has one caller and only forwards arguments; the repository
constructs equivalent cases directly.

**Decision:** Warning or suggestion by real maintenance cost; recommend the local pattern. Never label code
"AI-generated", rename for taste, or remove an abstraction that protects a boundary, enables testing or
already has several consumers.

## 4. Clean review with limited environment

**Situation:** Diff, callers and tests are inspectable; focused checks pass; the production-like environment
is not required by acceptance or the changed risk surface.

**Decision:** `APPROVE`, stating checks run and residual risk.

**Why:** Missing optional evidence is not `NEEDS_EVIDENCE`; that verdict is only for an item a defensible
gate decision requires.
