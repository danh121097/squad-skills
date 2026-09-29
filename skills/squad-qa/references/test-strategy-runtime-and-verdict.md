# Test strategy and verdict

Read before designing scenarios or selecting tools, and whenever test runners, browsers/devices,
services or observability are in question.

## Risk matrix

Select the gate-2 dimensions that apply; implementation structure belongs to Code Review. Do not run
every category mechanically. Add operations (deploy smoke, health, observability, rollback) when
infrastructure changed.

## Evidence contract

Record the exact target, command or manual path, environment/version, result, relevant artifact, and any
limitation. Redact tokens, credentials, personal data and private payloads.

On a fix rerun, retain evidence whose behavior, contract and environment are unchanged. Rerun the failed or
affected checks plus neighboring regression coverage; widen only when the delta changes the risk surface.
Never mutate production data without authority.

## Verdict

### PASS

- Acceptance coverage: criteria and evidence.
- Regression/risk coverage, environment, and residual risk with why it remains unverified.
- Next gate: Code Review.

### FAIL

- Blocking criterion/risk.
- Minimal steps and fixture/data setup.
- Expected versus actual.
- Which assertion failed, named rather than inferred from the runner's exit code. A non-zero exit can
  also mean the process was dirty — an unhandled rejection from a test double, a leaked handle, a worker
  that died after the assertions passed. Charging that to the product is a false `FAIL`, and a gate that
  issues one stops being believed.
- Deterministic artifact/log reference.
- Owning role and retest scope.

### NEEDS_ENVIRONMENT

- Exact missing executable target, browser/device, service, fixture/data, artifact, access or authorization.
- Why the missing item is required for an acceptance or material-risk decision.
- Smallest safe next action and owner (the lead, or the user when QA runs on its own), plus the QA scope to
  resume afterward.

Use `FAIL` only when evidence demonstrates a product/test defect or unmet criterion. `NEEDS_ENVIRONMENT`
blocks `done`, returns to the lead (or the user, run on its own) for resolution and resumes at QA.
