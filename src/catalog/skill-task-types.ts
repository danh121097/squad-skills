/**
 * Declared reading paths, transcribed from each skill's router. These word counts
 * are static estimates, not observed token usage or task-frequency statistics.
 * Lead and fix paths cover completion rather than mixing stages into their median.
 * Update the prose and table together; filesystem coverage cannot prove semantic routing.
 */
// Structurally the `TaskTypeDefinition` the measurement primitive takes, stated
// here rather than imported so this file stays plain data.
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
      'quality-bar-and-preflight.md',
    ],
  },
  { id: 'test-and-debug', references: ['quality-bar-and-preflight.md'] },
  { id: 'data-tooling-unavailable', references: ['backend-api-data-and-messaging.md'] },
];

const codeReview: SkillTaskType[] = [
  {
    id: 'feature-diff-review',
    references: [
      'quality-bar-and-preflight.md',
      'review-runtime-and-verdict.md',
      'review-stages-and-diff-notes.md',
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
    id: 'implementation-alignment-pass',
    references: [
      'quality-bar-and-preflight.md',
      'review-runtime-and-verdict.md',
      'review-stages-and-diff-notes.md',
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
  // Reviewing a runtime the reviewer has no defect model for needs the
  // per-ecosystem signatures beside the review dimensions, or the review is
  // generic where it most needs not to be.
  {
    id: 'unfamiliar-runtime-review',
    references: [
      'language-runtime-review-signatures.md',
      'quality-bar-and-preflight.md',
      'review-runtime-and-verdict.md',
    ],
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
    references: ['quality-bar-and-preflight.md'],
  },
  {
    id: 'delivery-decision-calibration',
    references: ['devops-worked-decisions.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'topology-selection-greenfield',
    references: ['platform-iac-and-delivery-matrix.md', 'quality-bar-and-preflight.md'],
  },
];

// Completion paths include diagnosis, ownership, verification and the quality bar.
const fixCore = [
  'bug-routing-and-ownership.md',
  'diagnosis-root-cause-and-fix-loop.md',
  'quality-bar-and-preflight.md',
  'verification-qa-review-and-reporting.md',
];
const fix: SkillTaskType[] = [
  ...(['codex', 'claude'] as const).map((runtime) => ({
    id: `${runtime}-subagent-repair`,
    references: [
      ...fixCore,
      'worker-sessions.md',
      'worker-models.md',
      `${runtime}-worker-dispatch.md`,
    ],
  })),
  {
    id: 'codex-shared-checkout-repair',
    references: [
      ...fixCore,
      'worker-sessions.md',
      'thread-handoff.md',
      'worker-models.md',
      'codex-chat-dispatch.md',
    ],
  },
  { id: 'single-session-repair', references: [...fixCore, 'worker-sessions.md'] },
  {
    id: 'codex-delegated-repair',
    references: [
      ...fixCore,
      'worker-sessions.md',
      'thread-handoff.md',
      'worker-models.md',
      'codex-chat-dispatch.md',
      'codex-worktree-handoff.md',
    ],
  },
  {
    id: 'claude-delegated-repair',
    references: [
      ...fixCore,
      'worker-sessions.md',
      'thread-handoff.md',
      'worker-models.md',
      'claude-chat-dispatch.md',
    ],
  },
  {
    id: 'ambiguous-repair',
    references: [...fixCore, 'worker-sessions.md', 'worked-bugfix-examples.md'],
  },
];

const frontend: SkillTaskType[] = [
  {
    id: 'local-pattern-change',
    references: [
      'frontend-security-accessibility-and-performance.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'screen-from-accepted-design',
    references: [
      'designer-gate-and-design-intake.md',
      'frontend-architecture-state-data-and-forms.md',
      'frontend-security-accessibility-and-performance.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'state-data-and-forms',
    references: [
      'frontend-architecture-state-data-and-forms.md',
      'frontend-security-accessibility-and-performance.md',
      'quality-bar-and-preflight.md',
    ],
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
    references: ['frontend-stack-and-motion-selection.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'ui-motion',
    references: [
      'frontend-security-accessibility-and-performance.md',
      'frontend-stack-and-motion-selection.md',
      'frontend-testing-and-debugging.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'interactive-graphics-and-games',
    references: [
      'frontend-security-accessibility-and-performance.md',
      'frontend-stack-and-motion-selection.md',
      'frontend-testing-and-debugging.md',
      'interactive-graphics-and-runtime-animation.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'test-and-debug',
    references: ['frontend-testing-and-debugging.md', 'quality-bar-and-preflight.md'],
  },
  {
    id: 'frontend-decision-calibration',
    references: ['frontend-worked-decisions.md', 'quality-bar-and-preflight.md'],
  },
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
    references: ['mobile-stack-architecture-and-data.md', 'quality-bar-and-preflight.md'],
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
    references: [
      'mobile-security-performance-testing-and-release.md',
      'quality-bar-and-preflight.md',
    ],
  },
  {
    id: 'mobile-decision-calibration',
    references: ['mobile-worked-decisions.md', 'quality-bar-and-preflight.md'],
  },
];

const qa: SkillTaskType[] = [
  {
    id: 'scenario-design-and-run',
    references: [
      'quality-bar-and-preflight.md',
      'test-selection-and-oracles.md',
      'test-strategy-runtime-and-verdict.md',
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
    references: ['quality-bar-and-preflight.md', 'test-strategy-runtime-and-verdict.md'],
  },
  {
    id: 'verdict-calibration',
    references: [
      'qa-worked-decisions.md',
      'quality-bar-and-preflight.md',
      'test-strategy-runtime-and-verdict.md',
    ],
  },
];

const teamCore = ['coordination-contract.md', 'delivery-pipeline-and-roster.md'];
const team: SkillTaskType[] = [
  ...(['codex', 'claude'] as const).map((runtime) => ({
    id: `${runtime}-subagent-delivery`,
    references: [...teamCore, 'worker-models.md', `${runtime}-worker-dispatch.md`],
  })),
  {
    id: 'codex-shared-checkout-delivery',
    references: [...teamCore, 'thread-handoff.md', 'worker-models.md', 'codex-chat-dispatch.md'],
  },
  { id: 'single-session-delivery', references: teamCore },
  {
    id: 'codex-delegated-delivery',
    references: [
      ...teamCore,
      'thread-handoff.md',
      'worker-models.md',
      'codex-chat-dispatch.md',
      'codex-worktree-handoff.md',
    ],
  },
  {
    id: 'claude-delegated-delivery',
    references: [...teamCore, 'thread-handoff.md', 'worker-models.md', 'claude-chat-dispatch.md'],
  },
  { id: 'missing-role-delivery', references: [...teamCore, 'domain-coverage-contracts.md'] },
  { id: 'ambiguous-delivery', references: [...teamCore, 'coordination-worked-decisions.md'] },
];

// squad-designer is measured on its median loaded set like every other skill
// instead of falling back to the blunt total-payload bound.
// Unqualified motion/audit/extension paths below target web; native paths load their own platform.
const designer: SkillTaskType[] = [
  {
    id: 'web-new-screen-greenfield',
    references: [
      'anti-slop-quality-review.md',
      'design-system-ux-accessibility-and-handoff.md',
      'official-sources.md',
      'platform-web-foundations-and-motion.md',
      'task-specific-ui-ux-research.md',
    ],
  },
  {
    id: 'web-redesign-existing-system',
    references: [
      'anti-slop-quality-review.md',
      'codebase-first-examples.md',
      'design-system-ux-accessibility-and-handoff.md',
      'official-sources.md',
      'platform-web-foundations-and-motion.md',
      'task-specific-ui-ux-research.md',
    ],
  },
  {
    id: 'figma-accepted-web-handoff',
    references: [
      'design-system-ux-accessibility-and-handoff.md',
      'platform-web-foundations-and-motion.md',
    ],
  },
  {
    id: 'design-system-tokens',
    references: [
      'anti-slop-quality-review.md',
      'design-system-ux-accessibility-and-handoff.md',
      'platform-web-foundations-and-motion.md',
    ],
  },
  {
    id: 'motion-direction',
    references: [
      'platform-web-foundations-and-motion.md',
      'design-system-ux-accessibility-and-handoff.md',
    ],
  },
  {
    id: 'accessibility-audit',
    references: [
      'platform-web-foundations-and-motion.md',
      'design-system-ux-accessibility-and-handoff.md',
    ],
  },
  {
    id: 'local-pattern-extension',
    references: [
      'platform-web-foundations-and-motion.md',
      'design-system-ux-accessibility-and-handoff.md',
    ],
  },
  {
    id: 'native-cross-platform-build',
    references: [
      'anti-slop-quality-review.md',
      'design-system-ux-accessibility-and-handoff.md',
      'platform-native-cross-platform.md',
    ],
  },
  {
    id: 'native-apple-android-build',
    references: [
      'anti-slop-quality-review.md',
      'design-system-ux-accessibility-and-handoff.md',
      'platform-native-apple-android.md',
    ],
  },
  {
    id: 'adaptive-web-split-view',
    references: [
      'platform-adaptive-layout-and-input.md',
      'platform-web-foundations-and-motion.md',
      'design-system-ux-accessibility-and-handoff.md',
    ],
  },
];

// squad-product routes by what the request still lacks, not by domain: a request
// with no checkable criteria is framed, one with criteria but no order is phased.
// Every task loads the quality bar except the source lookup, which answers a
// constraint question rather than handing over a plan — the entrypoint scopes
// the pre-flight to a plan for the same reason, so the two agree.
//
// Two edges were dropped here on the skill's first landing and are restored:
// `scope-cut-and-tradeoff` without the elicitation reference, and
// `write-plan-document` without the phasing rules, each justified by the task
// before it having already read them. A task type is an entry point, not a step.
// A run that arrives asking for the plan file loads no phasing rules under that
// reading, while plan-document-contract.md requires phases with owners and
// preconditions — so the saving was real only when a prior task happened to run.
// The median moved 2233 to 2740 restoring them, and that is the honest figure.
const product: SkillTaskType[] = [
  {
    id: 'frame-a-new-request',
    references: [
      'framing-and-acceptance-criteria.md',
      'quality-bar-and-preflight.md',
      'requirements-and-unknowns.md',
    ],
  },
  {
    id: 'plan-phases-and-ownership',
    references: [
      'framing-and-acceptance-criteria.md',
      'quality-bar-and-preflight.md',
      'scope-phasing-and-sequencing.md',
    ],
  },
  {
    id: 'scope-cut-and-tradeoff',
    references: [
      'quality-bar-and-preflight.md',
      'requirements-and-unknowns.md',
      'scope-phasing-and-sequencing.md',
    ],
  },
  {
    id: 'write-plan-document',
    references: [
      'plan-document-contract.md',
      'quality-bar-and-preflight.md',
      'scope-phasing-and-sequencing.md',
    ],
  },
  {
    id: 'product-calibration',
    references: ['product-worked-decisions.md', 'quality-bar-and-preflight.md'],
  },
  { id: 'source-lookup', references: ['official-sources.md'] },
];

/** Skills whose ceiling binds the median loaded set rather than the total. */
export const skillTaskTypes: Readonly<Record<string, SkillTaskType[]>> = {
  'squad-backend': backend,
  'squad-code-review': codeReview,
  'squad-designer': designer,
  'squad-devops': devops,
  'squad-fix': fix,
  'squad-frontend': frontend,
  'squad-mobile': mobile,
  'squad-product': product,
  'squad-qa': qa,
  'squads-team': team,
};
