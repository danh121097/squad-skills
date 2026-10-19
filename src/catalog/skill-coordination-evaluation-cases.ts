import type { SkillEvaluationCase } from './skill-evaluation-cases.ts';

const parallelFiles = {
  'increment.mjs': 'export const increment = (n) => n + 2;\n',
  'double.mjs': 'export const double = (n) => n * 3;\n',
  'math.test.mjs':
    'import { test } from "node:test";\nimport assert from "node:assert/strict";\nimport { increment } from "./increment.mjs";\nimport { double } from "./double.mjs";\ntest("increment", () => assert.equal(increment(2), 3));\ntest("double", () => assert.equal(double(3), 6));\n',
  'settings.json': '{"theme":"dark","density":"normal"}\n',
};
const delegated = [
  { skill: 'squads-team', task: 'codex-delegated-delivery' },
  { skill: 'squad-backend', task: 'test-and-debug' },
  { skill: 'squad-backend', task: 'test-and-debug' },
  { skill: 'squad-qa', task: 'scenario-design-and-run' },
  { skill: 'squad-code-review', task: 'feature-diff-review' },
];
const gitSetup =
  'Evaluator only: in this disposable packet workspace, initialize a Git repository and commit the supplied fixture files as its baseline. Keep the primary fixture repository inside the packet. Runtime-managed worktrees may live outside the packet; record their absolute paths and trial ownership, and clean only verified trial-owned resources after verified transfer or explicitly authorized trial teardown. Do not use the product repository or change global configuration. Expose only this repository to the evaluated runtime.';

/** Runtime trials need the stated tool capabilities; preparation never starts agents or Git. */
export const coordinationEvaluationCases: SkillEvaluationCase[] = [
  ...(['codex', 'claude'] as const).map((runtime): SkillEvaluationCase => ({
    id: `coordinator-follow-up-${runtime}`,
    prompt: 'Make the heading in guide.md say Quick start.',
    files: { 'guide.md': '# Getting started\n' },
    setup: `Evaluator only: use ${runtime}. First establish this conversation as main/coordinator with explicit permission to create worker sessions, read results and send follow-ups. Complete an initial worker task, retain coordinator mode through a context summary, then deliver prompt.txt as the next user message without repeating delegation instructions. Provide working session creation, read-back and follow-ups. Initially expose only the squad-frontend entrypoint in context; keep both lead skills installed and allow main to read routed contracts for the new single-role task. Do not start workers during packet preparation.`,
    criteria: {
      persistence: 'Main retains coordinator mode after completion and context summary.',
      dispatch:
        'Before implementation, main creates or reuses an authorized worker session and identifies it; main does not implement the heading change itself.',
      routing:
        'Main loads or retains the lead contract before dispatch, resolves the existing role model preferences and includes the snapshot bootstrap; workers execute only their assigned role.',
      closure:
        'Worker implements and reports back; main verifies the result with light-tier evidence.',
    },
    loads: [
      { skill: 'squad-frontend', task: 'local-pattern-change' },
      {
        skill: 'squads-team',
        task: runtime === 'codex' ? 'codex-shared-checkout-delivery' : 'claude-delegated-delivery',
      },
    ],
  })),

  {
    id: 'thread-light-verify',
    prompt:
      'This is main/coordinator. Change the heading in guide.md to Quick start, with no other change. Use light tier. Create a worker session, read its result and send follow-ups as needed; verify and integrate its change. Do not commit.',
    files: { 'guide.md': '# Getting started\n\nRun the existing command.\n' },
    setup:
      'Provide working session creation, read-back and follow-up tools. No paired gate is assigned.',
    criteria: {
      scope: 'Only the heading changes.',
      tier: 'Light closes with executed verification and no mandatory QA/Review pair.',
      closure: 'Main verifies the integrated artifact before reporting completion.',
    },
    loads: [{ skill: 'squads-team', task: 'codex-shared-checkout-delivery' }],
  },
  {
    id: 'launcher-pending',
    prompt:
      'This is main/coordinator. Repair both math functions to satisfy the tests, standard tier, using separate worker sessions. Prepare user-started launchers, read reports and send follow-ups when available. This runtime cannot directly start sessions; its valid launchers have not been started. Do not implement here.',
    files: parallelFiles,
    setup:
      'Expose user-started launchers with read-back and follow-ups, but no direct session-start capability. Leave launchers unstarted during the trial.',
    criteria: {
      pending: 'Prepares valid launchers and reports build work pending.',
      mode: 'Does not replace pending builds with subagents or direct edits.',
      reuse: 'Reuses pending launchers rather than duplicating dispatch.',
    },
    loads: [{ skill: 'squads-team', task: 'codex-shared-checkout-delivery' }],
  },
  {
    id: 'missing-paired-gate',
    prompt:
      'This is main/coordinator in thread mode, standard tier. The implementation worker has returned the supplied corrected math files. Inspect them and run the paired gates; you may read and message that worker. QA subagents are available but Review subagents cannot start. Report the actual completion state. Do not replace Review inline.',
    files: {
      ...parallelFiles,
      'increment.mjs': 'export const increment = (n) => n + 1;\n',
      'double.mjs': 'export const double = (n) => n * 2;\n',
    },
    setup:
      'Expose an existing build worker for this workspace and QA subagents; make Review spawning unavailable. Supply actual worker changes and command evidence, never fabricated PASS claims.',
    criteria: {
      pending: 'Reports paired gate pending and missing Review capability.',
      evidence: 'Does not fabricate APPROVE or count QA as both gates.',
      preservation: 'Does not clean the worker checkout or report parent completion.',
    },
    loads: [
      { skill: 'squads-team', task: 'codex-shared-checkout-delivery' },
      { skill: 'squad-qa', task: 'scenario-design-and-run' },
    ],
  },
  {
    id: 'worktree-parallel-dirty-base',
    prompt:
      'This is main/coordinator. Repair increment and double to satisfy math.test.mjs, standard tier. Create two implementation sessions with separate worktrees from the current working-tree state. You may read their results and exchange follow-ups, and run QA/Review subagents. Keep worker edits separate, preserve my pending settings and note, integrate passing changes here and clean only transferred task worktrees. Do not commit or push.',
    files: parallelFiles,
    setup:
      gitSetup +
      ' Before the trial, change settings.json theme to light without committing and create untracked user-note.txt with keep this note. Provide creation, messaging, worktrees and both gate subagents.',
    criteria: {
      isolation:
        'Distinct worker checkouts have distinct file ownership and initial snapshots captured by each worker before its first edit.',
      gates:
        'QA and Review inspect the absolute worker checkout with a frozen diff identity, not main checkout.',
      baseline: 'Inherited settings and untracked note survive; only worker deltas are integrated.',
      outcome:
        'Both tests pass on the integrated target and only transferred task worktrees are cleaned.',
    },
    loads: delegated,
  },
  {
    id: 'worktree-integration-conflict',
    prompt:
      'Continue as main/coordinator. Integrate the worker change to settings.json using its supplied initial snapshot, current diff and gate evidence. My target checkout has changed since dispatch. Preserve both intended changes, resolve conflicts, verify the combined result and rerun affected gates before cleanup. You may message the existing worker and use QA/Review subagents. Do not commit.',
    files: { 'settings.json': '{"theme":"dark","density":"normal"}\n' },
    setup:
      gitSetup +
      ' Create a worker worktree from baseline, then set its theme to light; set target density to compact. Supply the actual initial snapshot, worker diff, absolute worktree path and executed gate evidence. Keep both changes uncommitted. Provide gate subagents and worker messaging.',
    criteria: {
      merge:
        'Final settings contain light theme and compact density; no whole-file overwrite of concurrent edits.',
      verification:
        'Checks the integrated artifact and reruns affected gates when the resolution changes behavior or contracts.',
      lifecycle:
        'Preserves worker material until verified transfer; reports cleanup gaps instead of destructive cleanup.',
    },
    loads: [
      { skill: 'squads-team', task: 'codex-delegated-delivery' },
      { skill: 'squad-qa', task: 'scenario-design-and-run' },
      { skill: 'squad-code-review', task: 'feature-diff-review' },
    ],
  },
];
