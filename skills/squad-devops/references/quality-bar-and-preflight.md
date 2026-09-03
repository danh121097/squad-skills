# Quality bar and pre-flight

Read before applying a change or handing the delivery path to QA, Code Review or the lead. Every check
uses the repository's own pipelines and the provider tooling already in use, so the pass holds with no
other skill installed.

## What weak DevOps output looks like

- Evidence level inflated: a plan, a dry run or a green pipeline reported as deployed verification.
- Production used as the first integration test, because no ephemeral or staging target was built.
- A rollback that exists on paper — never triggered, no health signal defined to trigger it, and a restore
  path assumed from a backup nobody has restored.
- Clever dynamic infrastructure code: computed names, conditional resources, implicit provider behavior.
  The plan becomes unreadable, so nobody reads it.
- Environments copy-pasted and drifted apart, or an emergency console change never reconciled into source.
- Unpinned images, modules, actions or base tags, so the same commit produces a different artifact tomorrow.
- Secret values, tokens or environment dumps printed into logs, plans, pipeline output or a PR body.
- A wildcard permission granted "for now" and left in place.
- A watcher, tunnel, port-forward or temporary environment left running after the task ended.

## Pre-flight

Pass every applicable check honestly.

### Target and authorization

- Account or project, region, environment, cluster or service, and state backend are named, not assumed.
- The mutation performed is inside the requested scope; nothing else was applied along the way.
- Destructive and replacement operations in the plan were read before apply, not after.

### Reproducibility

- Inputs are pinned as the change requires, and the change lives in source rather than in a console.
- Deployed artifacts are referenced by immutable digest rather than a moving tag, so the thing verified
  is the thing that runs.

### Operability

- Health signals, rollout shape, rollback trigger and recovery path are defined before apply.
- Logs, metrics, traces and alert ownership cover the changed path.
- On self-hosted targets: reverse proxy and TLS renewal, process supervision, and a restore actually run.

### Safety

- Least privilege on every identity touched; secrets referenced by scope, never inlined or echoed.
- Task-owned processes, ports and temporary environments are stopped at the end of the task.

## Proof to hand over

Report static validation, plan or diff, deployed smoke check and production observation as separate levels,
naming the exact target for each. State the rollback readiness, what was not verified live, and which
task-owned resources were stopped. A level that did not run is reported as not run, never as a pass.
