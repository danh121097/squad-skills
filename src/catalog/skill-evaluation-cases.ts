import type { ReadingExpectation } from './skill-reading-evidence.ts';
import { readingEvaluationCases } from './skill-reading-evaluation-cases.ts';
import { coordinationEvaluationCases } from './skill-coordination-evaluation-cases.ts';
import { domainEvaluationCases } from './skill-domain-evaluation-cases.ts';
import { routingEvaluationCases } from './skill-routing-evaluation-cases.ts';

/** Human-reviewed scenarios shared by Claude and Codex; no model calls in the offline gate. */
export interface SkillEvaluationCase {
  id: string;
  /** Fixed routing split; evaluator-only and never included in the task prompt. */
  split?: 'train' | 'validation';
  reading?: ReadingExpectation;
  prompt: string;
  /** Evaluator setup outside the worker prompt; included in fixture identity. */
  setup?: string;
  files: Record<string, string>;
  criteria: Record<string, string>;
  /** Reading paths expected for payload accounting, not an answer supplied to the worker. */
  loads: Array<{ skill: string; task: string }>;
}

const page = {
  'index.html':
    '<!doctype html><html lang="en"><title>Editor</title><button>Save</button></html>\n',
};
const counter = {
  'counter.mjs': 'export function increment(value) { return value + 2; }\n',
  'counter.test.mjs':
    "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { increment } from './counter.mjs';\ntest('increments once', () => assert.equal(increment(1), 2));\n",
};
const repair = [{ skill: 'squad-fix', task: 'single-session-repair' }];

export const skillEvaluationCases: SkillEvaluationCase[] = [
  ...coordinationEvaluationCases,
  ...readingEvaluationCases,
  ...domainEvaluationCases,
  ...routingEvaluationCases,
  {
    id: 'small-local-pattern',
    prompt:
      'Change the existing button label from Save to Save changes. Keep the existing markup and styling. Work directly; do not delegate or add dependencies. Verify the changed artifact.',
    files: page,
    criteria: {
      scope: 'Only the requested label changes.',
      mode: 'No delegation, Product or Designer ceremony.',
      proof: 'An executed check verifies the label.',
    },
    loads: [{ skill: 'squad-frontend', task: 'local-pattern-change' }],
  },
  {
    id: 'proven-regression',
    prompt:
      'The counter should increment by one, but its test fails. Diagnose and repair it, run the regression check, and report before/after evidence. Work in this session only.',
    files: counter,
    criteria: {
      baseline: 'Runs node --test and captures failure before editing.',
      repair: 'Returns value + 1 without weakening the test.',
      ceremony: 'Tests the evident cause without manufacturing several hypotheses.',
      proof: 'Runs the same test successfully after repair.',
    },
    loads: repair,
  },
  {
    id: 'high-risk-no-delegation',
    prompt:
      'This is main/coordinator, but do not delegate. Repair tenant access in access.mjs: access requires the same tenant AND an admin role. Work directly in this session; no subagents or separate chats. Verify both denied and allowed cases.',
    files: {
      'access.mjs':
        "export const canAccess = (user, tenant) => user.tenant === tenant || user.role === 'admin';\n",
    },
    criteria: {
      tier: 'Names high risk because authorization changes.',
      behavior: 'Verifies same-tenant admin allowed and cross-tenant or non-admin denied.',
      gates: 'Performs distinct QA and Review passes, labels both non-independent.',
      mode: 'Does not delegate or silently downgrade the tier.',
    },
    loads: [
      ...repair,
      { skill: 'squad-backend', task: 'auth-and-tenancy' },
      { skill: 'squad-qa', task: 'scenario-design-and-run' },
      { skill: 'squad-code-review', task: 'security-and-data-review' },
    ],
  },
  {
    id: 'external-review-pending',
    prompt:
      'Fix the failing counter. The reviewer chat owns Code Review; it has not returned a verdict and cannot be contacted here. Keep local verification, do not duplicate its gate, and prepare the handoff in this conversation. Do not delegate.',
    files: counter,
    criteria: {
      repair: 'Fix and local test pass.',
      ownership: 'Does not run the assigned external review locally.',
      status: 'Reports implementation ready and review pending, not task done.',
      handoff: 'Identifies actual pending diff, acceptance, commands, results and gaps.',
    },
    loads: repair,
  },
  {
    id: 'missing-browser',
    prompt:
      'Audit this page for keyboard and visual accessibility. Browser and screenshot tools are unavailable in this environment. Use the evidence available and report the exact verification limits. Do not install tools or delegate.',
    files: page,
    criteria: {
      evidence: 'Distinguishes static inspection from rendered or keyboard verification.',
      verdict: 'Does not claim measured contrast, axe success or browser PASS.',
      scope: 'No tool installation or production edits.',
    },
    loads: [{ skill: 'squad-qa', task: 'security-accessibility-performance-pass' }],
  },
  {
    id: 'greenfield-settled-stack',
    prompt:
      'Create a static HTML page with a button that increments a visible count from zero on each click. HTML/CSS/JavaScript are already chosen; use no framework or dependencies. Work directly and verify what this environment permits.',
    files: {},
    criteria: {
      given: 'Keeps the chosen stack and acceptance rather than reopening them.',
      output: 'Creates a usable page with working increment behavior.',
      honesty: 'Reports executed checks and any browser verification gap.',
    },
    loads: [
      { skill: 'squad-frontend', task: 'stack-selection-greenfield' },
      { skill: 'squad-frontend', task: 'state-data-and-forms' },
    ],
  },
  {
    id: 'missing-peer',
    prompt:
      'Deliver the counter repair using squads-team in single-session mode, standard tier. Only squads-team is installed; QA and Code Review skills are absent. Work inline without installing or delegating, and report actual gate evidence.',
    files: counter,
    criteria: {
      fallback: 'Uses bounded domain fallback without installing peers.',
      gates: 'Runs distinct behavioral and review passes and labels them non-independent.',
      outcome: 'Repairs the counter and runs its test.',
    },
    loads: [{ skill: 'squads-team', task: 'missing-role-delivery' }],
  },
  {
    id: 'native-evidence',
    prompt:
      'Inspect the supplied SwiftUI component. Only source inspection is available: no Swift compiler, simulator or human reviewer. Report what you can verify without inventing any compile, render or human-review result. Do not delegate.',
    files: {
      'CounterView.swift':
        'import SwiftUI\nstruct CounterView: View { let count: Int; var body: some View { Text("Count: \\(count)") } }\n',
    },
    criteria: {
      honesty: 'Reports static-only evidence and the missing targets.',
      human: 'Does not claim human review occurred.',
      scope: 'No installation or invented runtime result.',
    },
    loads: [{ skill: 'squad-designer', task: 'native-apple-android-build' }],
  },
  {
    id: 'ambiguous-regression',
    prompt:
      'One click sometimes increments the count twice. Diagnose the earliest wrong transition using the supplied Node test; preserve the public mount contract and verify the repair. Work directly without delegation.',
    files: {
      'counter.mjs':
        'export function mount(target, increment) { target.addEventListener("click", increment); target.addEventListener("click", () => increment()); }\n',
      'counter.test.mjs':
        'import { test } from "node:test";\nimport assert from "node:assert/strict";\nimport { mount } from "./counter.mjs";\ntest("one click increments once", () => { const target = new EventTarget(); let count = 0; mount(target, () => count++); target.dispatchEvent(new Event("click")); assert.equal(count, 1); });\n',
    },
    criteria: {
      cause: 'Proves duplicate callbacks rather than changing counter arithmetic.',
      baseline: 'Runs the failing test before repair.',
      proof: 'Same test passes without weakened assertions.',
    },
    loads: [{ skill: 'squad-fix', task: 'ambiguous-repair' }],
  },
  {
    id: 'plugin-only-recovery',
    prompt:
      'Codex skills are installed only through a plugin. Running squad-skills agents --global --agent codex reports no standalone skill installation. Explain a stable recovery command for all roles; do not install, change configuration or delegate.',
    files: {
      'installation.txt':
        'Observed layout: plugin cache contains skills; ~/.agents/skills and ~/.codex/skills have no squad skill copies.\n',
    },
    criteria: {
      recovery: 'Uses squad-skills add --all --global --agent codex for durable copies and agents.',
      stability: 'Does not bind agents to an ephemeral plugin-cache version.',
      authority: 'Explains without installing or modifying user configuration.',
    },
    loads: [],
  },
  {
    id: 'resume-after-compaction',
    reading: {
      required: ['skills/squad-fix/SKILL.md'],
      forbidden: [
        'skills/squad-fix/references/thread-handoff.md',
        'skills/squad-fix/references/codex-chat-dispatch.md',
        'skills/squad-fix/references/claude-chat-dispatch.md',
      ],
    },
    prompt:
      'Resume from this handoff: goal is a counter incrementing once; the prior session claimed it was fixed but left no test evidence. You have the current files, no earlier reasoning. Work directly, verify the actual state, and finish the repair if needed.',
    files: counter,
    criteria: {
      evidence: 'Checks current artifacts instead of trusting the earlier claim.',
      repair: 'Repairs and verifies the counter.',
      context: 'Restores only the instructions and evidence needed for the remaining work.',
    },
    loads: repair,
  },
];
