# DevOps worked decisions

Read when a delivery, pipeline-trust or supply-path decision is ambiguous. Adapt the reasoning to the
target and authority actually in scope; these are not templates.

Each example carries its provenance. **Observed** happened in a run this catalog's maintainers recorded;
**constructed** is derived from documentation and was not measured. Weigh them accordingly.

## 1. One contract asserted in three places

**Evidence:** The packaged file list lived in the package manifest, in a release-readiness check and in a
package-contents check. The three disagreed about one entry, the release gate went red, and because that
gate was the only job running the full suite, the test, build and packaging checks did not run for six
days.

**Decision:** When a contract has more than one owner, pin the set in a test rather than in prose, and fix
every copy in one commit. Also check what else a red gate is silently skipping — the visible failure was
one file name; the real damage was the six days of unrun checks behind it.

**Observed:** this catalog's own release pipeline; the three sources agree again and its agent contract
names all three together.

## 2. The pipeline enforces the isolation, not the reviewer

**Evidence:** A private artifact store must stay unreachable from every CI path. Review can miss a workflow
that names its variable, triggers on a fork-writable event, or reads a stored secret.

**Decision:** Assert all three in a validator the gate runs, so a workflow that breaks isolation fails
rather than depending on someone noticing it in a diff.

**Observed:** this catalog's evaluation validator asserts exactly those three properties across its
workflow directory.

## 3. Never skip the gate for the product's own payload

**Evidence:** A path filter that ignores documentation changes looks like a cheap saving.

**Decision:** Do not add one when the product itself is those files. Filter on what cannot affect the
artifact, and prove that claim before filtering.

**Observed:** this catalog forbids configuring CI to ignore Markdown changes, because its shipped payload
is Markdown.

## 4. A third-party check does not belong in the blocking gate

**Evidence:** Link liveness depends on dozens of external hosts, so it fails on their state rather than on
the change under test.

**Decision:** Run it as its own non-blocking job on a cadence the maintainer owns, and keep the blocking
gate offline and deterministic. Report the result to the person who can fix it instead of failing an
unrelated pull request.

**Observed:** this catalog runs its source-liveness check as a job of its own — weekly on a schedule, and
on pull requests where it is marked non-blocking — never inside the gate that must pass.

## 5. Never run contributed code with repository credentials

**Decision:** A contributed script is untrusted input. Execute it, if at all, with no secrets and no write
scope; grant a workflow the least privilege the job needs and nothing held "for now". The cost is that some
checks cannot run on a fork's pull request at all — report that gap and run them after review, rather than
buying the coverage with a credential.

**Observed:** stated as a standing boundary in this catalog's agent contract.

## 6. A restore nobody ran is not a recovery path

**Decision:** Before mutating a shared or persistent target, restore the backup somewhere disposable and
record what came back and how long it took. A snapshot proves storage, not recovery.

**Constructed:** the rule this role's quality bar already carries; no recorded restore behind it.
