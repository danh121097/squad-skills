import { describe, expect, it } from 'vitest';

import {
  extractFeedbackFields,
  issueToFeedbackRecord,
  parseGithubFeedbackIssues,
  renderDailySummary,
  sanitizeFeedbackText,
} from '../../scripts/feedback/create-daily-summary.ts';

describe('daily feedback summary', () => {
  it('redacts credentials and machine-local paths before rendering', () => {
    const safe = sanitizeFeedbackText('token=ghp_12345678901234567890 at /Users/danh/private.txt');

    expect(safe).toContain('token: [REDACTED_SECRET]');
    expect(safe).toContain('[REDACTED_LOCAL_PATH]');
    expect(safe).not.toContain('ghp_');
    expect(safe).not.toContain('/Users/danh');
  });

  it('parses the inbox field contract and leaves optional values explicit', () => {
    const fields = extractFeedbackFields(`
- **Skill:** squad-qa 1.7.0
- **Task/stack:** TypeScript repository
- **Expected:** A deterministic test
- **Actual:** The test missed the regression
- **Evidence:** Reproduction steps
- **Outcome:** open
`);

    expect(fields).toEqual({
      skillVersion: 'squad-qa 1.7.0',
      taskStack: 'TypeScript repository',
      expected: 'A deterministic test',
      actual: 'The test missed the regression',
      evidence: 'Reproduction steps',
      candidateRule: 'unknown',
      dispositionOutcome: 'open',
    });
  });

  it('parses only labelled GitHub feedback issues and captures runtime separately', () => {
    const issues = parseGithubFeedbackIssues(
      JSON.stringify([
        {
          number: 12,
          title: 'Output problem',
          body: [
            '### Which skill',
            'squad-frontend',
            '### Version',
            '0.2.0',
            '### Runtime and model',
            'Codex',
            '### The task and the stack',
            'Nuxt',
            '### What you expected',
            'Working output',
            '### What you got',
            'Missing state',
          ].join('\n'),
          url: 'https://github.com/danh121097/squad-skills/issues/12',
          updatedAt: '2026-09-08T10:00:00Z',
          labels: [{ name: 'skill-feedback' }],
        },
        { number: 13, labels: [{ name: 'bug' }] },
      ])
    );

    const record = issueToFeedbackRecord(issues[0]!);

    expect(issues).toHaveLength(1);
    expect(record.fields.skillVersion).toBe('squad-frontend\n0.2.0\nRuntime/model: Codex');
    expect(record.fields.taskStack).toBe('Nuxt');
    expect(record.fields.actual).toBe('Missing state');
  });

  it('renders untrusted issue titles as code text rather than link labels', () => {
    const markdown = renderDailySummary(
      {
        reportDate: '2026-09-08',
        windowStart: new Date('2026-09-07T17:00:00Z'),
        windowEnd: new Date('2026-09-08T17:00:00Z'),
      },
      [
        {
          sourceKey: 'issue:1',
          sourceLabel: 'Issue #1 — title [injected]',
          sourceUrl: 'https://github.com/danh121097/squad-skills/issues/1',
          fields: {
            skillVersion: 'unknown',
            taskStack: 'unknown',
            expected: 'unknown',
            actual: 'unknown',
            evidence: 'unknown',
            candidateRule: 'unknown',
            dispositionOutcome: 'open',
          },
        },
      ]
    );

    expect(markdown).toContain('## 1. Issue 1 — title injected');
    expect(markdown).toContain(
      '[GitHub issue](https://github.com/danh121097/squad-skills/issues/1)'
    );
    expect(markdown).not.toContain('[Issue #1');
  });

  it('does not turn a non-GitHub source URL into a report link', () => {
    const [issue] = parseGithubFeedbackIssues(
      JSON.stringify([
        {
          number: 2,
          body: '### Which skill\nsquad-qa',
          url: 'https://example.test/issue/2',
          updatedAt: '2026-09-08T10:00:00Z',
          labels: [{ name: 'skill-feedback' }],
        },
      ])
    );

    expect(issueToFeedbackRecord(issue!).sourceUrl).toBeUndefined();
  });
});
