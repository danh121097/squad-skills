import type { RoleReportContract } from './role-report-contract.ts';

/**
 * One contract per role whose report a gate consumes.
 *
 * Every `requirement` is quoted from that skill's own completion checklist or
 * handoff contract, so this file transcribes rather than invents. When a
 * checklist line changes, the quote here stops matching it and the transcription
 * is what has to move — the same discipline `skill-task-types.ts` uses for
 * routers.
 *
 * Two roles rather than one, deliberately. A checker with a single valid role is
 * a control that cannot fire, which is the test this repository applies to its
 * clauses; QA and Code Review are the two roles whose reports another gate reads
 * before deciding anything.
 */
const residualRisk = {
  families: [
    [
      /residual\s+risk/i,
      /\b(?:not|never|un)\s*(?:asserted|covered|verified|tested|checked)\b/i,
      /\bdeliberately not\b/i,
      /\bout of scope\b/i,
      /\bremains? unverified\b/i,
      /\buntested\b/i,
    ],
  ],
  minimumFamilies: 1,
};

const executionMode = {
  families: [[/\bindependen(?:t|ce)\b/i, /\bsingle[- ]session\b/i, /\bsame session\b/i]],
  minimumFamilies: 1,
};

export const qaReportContract: RoleReportContract = {
  role: 'squad-qa',
  // Ordered most specific first so a compound verdict is not shadowed by a
  // substring of a simpler one.
  verdicts: ['NEEDS_ENVIRONMENT', 'FAIL', 'PASS'],
  elements: [
    {
      id: 'acceptance-traceability',
      requirement: 'Every acceptance criterion maps to evidence or explicit rationale',
      families: [
        [/acceptance criteri/i, /\bAC-?\d/i, /\bcriterion\b/i],
        // "traced to the three acceptance criteria" is the requirement stated
        // plainly, so the stem is `trace`, not `traceab`. Found by a real report
        // that mapped every criterion and scored a miss for the wording.
        [
          /\btrace[sd]?\b|traceab/i,
          /\|\s*(?:AC-?\d|criterion)/i,
          /criterion\s*\|/i,
          /\b(?:per|mapp?e?d? to|against) (?:the \w+ )?(?:acceptance )?criteri/i,
        ],
      ],
      minimumFamilies: 2,
    },
    {
      id: 'determinism',
      requirement: 'Tests use deterministic synchronization and stable fixtures',
      families: [
        [
          /determinis/i,
          /\bstable fixtures?\b/i,
          /\brepeatab/i,
          /\bno (?:clock|shared state|randomness|ordering)/i,
          /\bidentical (?:every time|across|result)/i,
          /\brun \d+ times\b/i,
        ],
      ],
      minimumFamilies: 1,
    },
    {
      id: 'environment-and-commands',
      requirement:
        'Environment, commands, data, browser/device/service versions and artifacts are recorded',
      families: [
        [/`[^`\n]*\b(?:node|npm|pnpm|yarn|pytest|go test|cargo|vitest|jest|playwright)\b[^`\n]*`/i],
        [
          /\b(?:node|python|go|java|ruby|php|macos|linux|windows|chrome|firefox|safari|ios|android)\b[^\n]{0,24}\bv?\d+\.\d+/i,
        ],
      ],
      minimumFamilies: 2,
    },
    {
      id: 'residual-risk',
      requirement: 'Coverage and residual risk are reported without overstating untested areas',
      ...residualRisk,
    },
    {
      id: 'execution-mode',
      requirement:
        'Execution mode states whether this was independent-agent QA or a single-session logical pass',
      ...executionMode,
    },
  ],
};

export const codeReviewReportContract: RoleReportContract = {
  role: 'squad-code-review',
  verdicts: ['CHANGES_REQUESTED', 'NEEDS_EVIDENCE', 'APPROVE'],
  elements: [
    {
      id: 'finding-evidence',
      requirement:
        'Findings include tight file:line, failure condition, impact and concrete remediation',
      families: [
        [/[\w./-]+\.\w{1,5}:\d+/],
        [/\bremediat/i, /\bimpact\b/i, /\bfailure condition\b/i],
      ],
      minimumFamilies: 2,
    },
    {
      id: 'blast-radius',
      requirement:
        'Contracts, consumers, data/auth paths and operational blast radius were inspected',
      families: [
        [
          /\bblast radius\b/i,
          /\bconsumers?\b/i,
          /\bcallers?\b/i,
          /\bcontracts?\b/i,
          /\bmigration/i,
        ],
      ],
      minimumFamilies: 1,
    },
    {
      id: 'scope-and-target',
      requirement: 'Exact target/base, acceptance and QA evidence are resolved',
      families: [
        [/\bbase\b/i, /\btarget\b/i, /\brevision\b/i, /\bcommit\b/i, /\bdiff\b/i, /\bPR\b/],
      ],
      minimumFamilies: 1,
    },
    {
      id: 'residual-risk',
      requirement: 'Verdict and residual unverified risk are explicit',
      ...residualRisk,
    },
    {
      id: 'execution-mode',
      requirement:
        'Execution mode states whether this was independent-agent review or a single-session logical pass',
      ...executionMode,
    },
  ],
};

export const roleReportContracts: Readonly<Record<string, RoleReportContract>> = {
  'squad-qa': qaReportContract,
  'squad-code-review': codeReviewReportContract,
};
