/**
 * What each skill's router actually loads, per task.
 *
 * `skill-payload-ceilings.ts` bounds a skill's total payload because a skill
 * that declares no task types has no loaded set to measure. That bound is the
 * blunt one: it taxes depth a run never pays for, and taxing depth is the
 * opposite of what a role-specialist catalog wants. `squad-designer` shows the
 * gap — 7,497 words shipped, 1,959 loaded by the median task, because its
 * router means an accessibility audit never opens the native references.
 *
 * A skill listed here declares the same thing, so its ceiling binds the median
 * loaded set instead of the total. The incentive is deliberate: depth costs
 * only the tasks that actually read it, and writing more is affordable exactly
 * when the router says who loads it.
 *
 * Transcribed by hand from each skill's own router section, so it can drift
 * from the prose it describes. Two checks bound the damage rather than remove
 * it: a task type routing to a file that does not exist fails the measurement,
 * and a reference no task type loads fails as unrouted, so nothing here can
 * hide payload from the median by leaving it out. What neither check sees is a
 * task type that lists fewer references than the router would really open, so
 * treat a reference list as part of the router when editing either one.
 *
 * `squad-designer` is deliberately absent. Its task types live in
 * `evals/squad-designer/baseline-manifest.yml`, where the evaluation budget
 * binds them; a second copy here would drift from the one that governs. Its
 * catalog ceiling stays on total payload as the outer bound.
 */
// Structurally the `TaskTypeDefinition` the measurement primitive takes, stated
// here rather than imported so catalog data does not depend on `src/eval/`.
export interface SkillTaskType {
  /** Reference file names, relative to the skill's `references/` directory. */
  references: string[];
  /** Stable name for the task, used in validator output. */
  id: string;
}

/**
 * Fewer than this and a median says almost nothing: two task types make the
 * median their mean, and one makes it the only value there is.
 */
export const minimumTaskTypes = 3;

const backend: SkillTaskType[] = [
  {
    id: 'endpoint-on-existing-stack',
    references: [
      'backend-api-data-and-messaging.md',
      'backend-security-auth-and-privacy.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'schema-and-migration',
    references: [
      'backend-api-data-and-messaging.md',
      'backend-performance-reliability-and-observability.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'auth-and-tenancy',
    references: ['backend-security-auth-and-privacy.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'stack-selection-greenfield',
    references: [
      'backend-stack-and-runtime-matrix.md',
      'backend-system-design-and-distributed-systems.md',
      'official-sources.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'architecture-and-scaling',
    references: [
      'backend-performance-reliability-and-observability.md',
      'backend-system-design-and-distributed-systems.md',
      'backend-worked-decisions.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'performance-investigation',
    references: [
      'backend-performance-reliability-and-observability.md',
      'backend-testing-debugging-and-mindset.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'test-and-debug',
    references: ['backend-testing-debugging-and-mindset.md', 'quality-bar-and-preflight.md'],
  },
  { id: 'degraded-runtime-fallback', references: ['runtime-capability-fallbacks.md'] },
];

const codeReview: SkillTaskType[] = [
  {
    id: 'feature-diff-review',
    references: [
      'cross-stack-review-dimensions.md',
      'quality-bar-and-preflight.md',
      'review-methodology-debugging-and-mindset.md',
      'review-runtime-and-verdict.md',
    ],
  },
  {
    id: 'security-and-data-review',
    references: [
      'quality-bar-and-preflight.md',
      'review-runtime-and-verdict.md',
      'security-architecture-data-and-operations-review.md',
    ],
  },
  {
    id: 'spec-compliance-pass',
    references: [
      'quality-bar-and-preflight.md',
      'review-methodology-debugging-and-mindset.md',
      'review-runtime-and-verdict.md',
    ],
  },
  {
    id: 'severity-calibration',
    references: [
      'code-review-worked-decisions.md',
      'quality-bar-and-preflight.md',
      'review-runtime-and-verdict.md',
    ],
  },
  {
    id: 'standard-lookup',
    references: ['official-sources.md', 'review-runtime-and-verdict.md'],
  },
];

const devops: SkillTaskType[] = [
  {
    id: 'pipeline-or-iac-change',
    references: [
      'platform-iac-and-delivery-matrix.md',
      'quality-bar-and-preflight.md',
      'security-networking-secrets-and-supply-chain.md',
    ],
  },
  {
    id: 'self-hosted-delivery',
    references: [
      'quality-bar-and-preflight.md',
      'security-networking-secrets-and-supply-chain.md',
      'self-hosted-vps-and-reverse-proxy.md',
    ],
  },
  {
    id: 'observability-and-slo',
    references: ['quality-bar-and-preflight.md', 'sre-observability-resilience-and-cost.md'],
  },
  {
    id: 'rollout-and-rollback',
    references: [
      'platform-iac-and-delivery-matrix.md',
      'quality-bar-and-preflight.md',
      'sre-observability-resilience-and-cost.md',
    ],
  },
  {
    id: 'deploy-failure-diagnosis',
    references: ['devops-testing-debugging-and-mindset.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'delivery-decision-calibration',
    references: ['devops-worked-decisions.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'topology-selection-greenfield',
    references: [
      'official-sources.md',
      'platform-iac-and-delivery-matrix.md',
      'quality-bar-and-preflight.md',
    ],
  },
  { id: 'degraded-runtime-fallback', references: ['runtime-and-safe-delivery-fallbacks.md'] },
];

const fix: SkillTaskType[] = [
  {
    id: 'diagnose-and-route',
    references: ['bug-routing-and-ownership.md', 'diagnosis-root-cause-and-fix-loop.md'],
  },
  {
    id: 'root-cause-to-fix',
    references: [
      'diagnosis-root-cause-and-fix-loop.md',
      'quality-bar-and-preflight.md',
      'verification-qa-review-and-reporting.md',
    ],
  },
  {
    id: 'regression-evidence',
    references: ['quality-bar-and-preflight.md', 'verification-qa-review-and-reporting.md'],
  },
  {
    id: 'bugfix-calibration',
    references: ['quality-bar-and-preflight.md', 'worked-bugfix-examples.md'],
  },
  { id: 'source-lookup', references: ['official-sources.md'] },
  { id: 'degraded-runtime-fallback', references: ['runtime-capability-fallbacks.md'] },
];

const frontend: SkillTaskType[] = [
  {
    id: 'screen-from-accepted-design',
    references: [
      'designer-gate-and-design-intake.md',
      'frontend-architecture-state-data-and-forms.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'state-data-and-forms',
    references: ['frontend-architecture-state-data-and-forms.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'accessibility-security-performance',
    references: [
      'frontend-security-accessibility-and-performance.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'stack-selection-greenfield',
    references: [
      'frontend-stack-and-motion-selection.md',
      'official-sources.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'motion-implementation',
    references: ['frontend-stack-and-motion-selection.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'test-and-debug',
    references: ['frontend-testing-debugging-and-mindset.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'frontend-decision-calibration',
    references: ['frontend-worked-decisions.md', 'quality-bar-and-preflight.md'],
  },
  { id: 'degraded-runtime-fallback', references: ['runtime-capability-fallbacks.md'] },
];

const mobile: SkillTaskType[] = [
  {
    id: 'screen-from-accepted-design',
    references: [
      'design-platform-and-lifecycle-gates.md',
      'mobile-stack-architecture-and-data.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'offline-sync-and-lifecycle',
    references: [
      'design-platform-and-lifecycle-gates.md',
      'mobile-stack-architecture-and-data.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'stack-selection-new-app',
    references: [
      'mobile-stack-architecture-and-data.md',
      'official-sources.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'security-performance-and-release',
    references: [
      'mobile-security-performance-testing-and-release.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'crash-and-jank-diagnosis',
    references: ['mobile-debugging-and-mindset.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'mobile-decision-calibration',
    references: ['mobile-worked-decisions.md', 'quality-bar-and-preflight.md'],
  },
  { id: 'degraded-runtime-fallback', references: ['runtime-capability-fallbacks.md'] },
];

const qa: SkillTaskType[] = [
  {
    id: 'scenario-design-and-run',
    references: [
      'quality-bar-and-preflight.md',
      'test-strategy-runtime-and-verdict.md',
      'testing-domains-and-tooling-matrix.md',
    ],
  },
  {
    id: 'suite-architecture-and-flakiness',
    references: [
      'quality-bar-and-preflight.md',
      'test-architecture-data-flakiness-and-ci.md',
      'test-strategy-runtime-and-verdict.md',
    ],
  },
  {
    id: 'security-accessibility-performance-pass',
    references: [
      'quality-bar-and-preflight.md',
      'security-accessibility-performance-and-release.md',
      'test-strategy-runtime-and-verdict.md',
    ],
  },
  {
    id: 'reproduce-and-verify-fix',
    references: [
      'qa-debugging-and-mindset.md',
      'quality-bar-and-preflight.md',
      'test-strategy-runtime-and-verdict.md',
    ],
  },
  {
    id: 'verdict-calibration',
    references: [
      'qa-worked-decisions.md',
      'quality-bar-and-preflight.md',
      'test-strategy-runtime-and-verdict.md',
    ],
  },
  {
    id: 'tooling-lookup',
    references: ['official-sources.md', 'test-strategy-runtime-and-verdict.md'],
  },
];

const team: SkillTaskType[] = [
  {
    id: 'frame-and-route',
    references: ['delivery-pipeline-and-roster.md', 'domain-coverage-contracts.md'],
  },
  {
    id: 'select-execution-mode',
    references: ['coordination-contract.md', 'delivery-pipeline-and-roster.md'],
  },
  { id: 'advance-a-gate', references: ['delivery-pipeline-and-roster.md'] },
  {
    id: 'carry-an-absent-role',
    references: ['delivery-pipeline-and-roster.md', 'domain-coverage-contracts.md'],
  },
  {
    id: 'ambiguous-routing-calibration',
    references: ['coordination-worked-decisions.md', 'delivery-pipeline-and-roster.md'],
  },
];

/** Skills whose ceiling binds the median loaded set rather than the total. */
export const skillTaskTypes: Readonly<Record<string, SkillTaskType[]>> = {
  'squad-backend': backend,
  'squad-code-review': codeReview,
  'squad-devops': devops,
  'squad-fix': fix,
  'squad-frontend': frontend,
  'squad-mobile': mobile,
  'squad-qa': qa,
  'squads-team': team,
};
