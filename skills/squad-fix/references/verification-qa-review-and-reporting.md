# Verification, QA, Review, and reporting

Read before completion or whenever verification reveals a side effect, missing environment or uncertain
review evidence.

## Verification layers

1. Rerun the exact pre-fix reproduction or static proof.
2. Run the focused regression test/check that protects the repaired invariant, at the seam depth set in the
   diagnosis reference's verify-and-prevent step.
3. Test the blast radius: affected modules, callers/consumers, contracts, permissions, data/lifecycle/timing
   paths and supported platforms relevant to the defect.
4. Run type/lint/build and integration/performance/security/operations checks when the changed contract or
   risk requires them.
5. Confirm no unrelated public contract, schema, environment/config key or user workflow changed silently.

Report static, local, browser/device, integration, CI, staging and production evidence separately. A lower
verification level can be sufficient for a low-risk bug, but it must never be described as a higher level.
Without a browser/device/service or CI/provider access, use static and local evidence where sufficient, name
the exact missing target, claim no pipeline or deployed state, and request the smallest safe log, status or
artifact.

Remove every tagged diagnostic probe before handing over, and verify removal by grepping its marker.

## Gates

`squad-qa` and `squad-code-review` define their verdicts (`PASS`, `FAIL`, `NEEDS_ENVIRONMENT`; `APPROVE`,
`CHANGES_REQUESTED`, `NEEDS_EVIDENCE`); this role routes them per the workflow's gate step. After a fix for a
`FAIL`, rerun the affected and regression scope before changing the verdict.

In one session, QA and Review are fresh logical passes, not independent-agent judgments; say so in the final
report.
