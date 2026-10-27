import type { SkillEvaluationCase } from './skill-evaluation-cases.ts';

/** Constructed tasks exercise domain decisions; preparation never runs these fixtures. */
export const domainEvaluationCases: SkillEvaluationCase[] = [
  {
    id: 'product-partial-frame',
    prompt:
      'Dùng squad-product để hoàn thiện phạm vi MVP từ brief.md. Giữ các quyết định đã chốt; làm rõ phần còn thiếu, tiêu chí nghiệm thu và thứ tự công việc. Trả lời trong chat, chưa viết file hay triển khai. Làm trực tiếp, không delegate.',
    files: {
      'brief.md':
        '# Vendor requests\n\nChosen: React web app, existing Node service and PostgreSQL. Internal purchasing staff submit vendor requests; managers approve or reject with a reason. Ship one usable flow in two weeks. SSO and department membership already exist. No supplier portal or payments. Open: may a manager approve their own request? A decision has not been made. The request list should feel fast.\n',
    },
    criteria: {
      given: 'Keeps the chosen stack, existing SSO, deadline and explicit non-goals.',
      decision:
        'Surfaces self-approval as an unresolved user decision with options and consequences; does not silently choose a policy.',
      acceptance:
        'Defines observable submit/approve/reject and permission/error outcomes; treats the vague latency goal as an assumption or question, not a measured fact.',
      sequence:
        'Orders a complete first flow by dependencies and names each required role and its responsibility.',
      scope: 'Does not implement, delegate or write a plan file.',
    },
    loads: [
      { skill: 'squad-product', task: 'frame-a-new-request' },
      { skill: 'squad-product', task: 'plan-phases-and-ownership' },
    ],
  },
  {
    id: 'mobile-offline-retry',
    prompt:
      'Use squad-mobile to repair the offline outbox used by our existing React Native app. Persisted edits must survive a timeout and app restart, including restart while a request is still pending, reuse their operation IDs on retry, and disappear only after a matching acknowledgement. An edit queued while another is sending must survive. Preserve the syncEdits(store, send) API; send receives { id, payload } and resolves to { id } or rejects. Work directly without installing, delegating or changing server behavior. Run node --test and report the native-device verification gap.',
    files: {
      'outbox.mjs': `export async function syncEdits(store, send) {
  const pending = await store.read();
  await store.write([]);
  for (const operation of pending) await send(operation);
}
`,
      'outbox.test.mjs': `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncEdits } from './outbox.mjs';
const edit = (id) => ({ id, payload: { note: id } });
function storeFrom(initial) {
  let disk = JSON.stringify(initial);
  return { read: async () => JSON.parse(disk), write: async (rows) => { disk = JSON.stringify(rows); } };
}
test('timeout and restart preserve IDs until acknowledgement', async () => {
  const store = storeFrom([edit('op-1'), edit('op-2')]);
  const sent = [];
  await syncEdits(store, async (operation) => {
    sent.push(operation.id);
    if (operation.id === 'op-2') throw new Error('timeout');
    return { id: operation.id };
  }).catch(() => {});
  assert.deepEqual(await store.read(), [edit('op-2')]);
  const restarted = storeFrom(await store.read());
  await syncEdits(restarted, async (operation) => { sent.push(operation.id); return { id: operation.id }; });
  assert.deepEqual(sent, ['op-1', 'op-2', 'op-2']);
  assert.deepEqual(await restarted.read(), []);
});
test('restart while send is pending preserves persisted edits', async () => {
  const store = storeFrom([edit('op-1')]);
  let signalSending;
  let acknowledge;
  const sending = new Promise(resolve => { signalSending = resolve; });
  const acknowledgement = new Promise(resolve => { acknowledge = resolve; });
  const inFlight = syncEdits(store, operation => {
    signalSending(operation.id);
    return acknowledgement;
  });
  try {
    assert.equal(await sending, 'op-1');
    // Restart from persisted data before the original request has settled.
    const restarted = storeFrom(await store.read());
    assert.deepEqual(await restarted.read(), [edit('op-1')]);
    const retried = [];
    await syncEdits(restarted, async operation => {
      retried.push(operation.id);
      return { id: operation.id };
    });
    assert.deepEqual(retried, ['op-1']);
    assert.deepEqual(await restarted.read(), []);
  } finally {
    acknowledge({ id: 'op-1' });
    await inFlight;
  }
  assert.deepEqual(await store.read(), []);
});
test('an unrelated acknowledgement preserves the edit', async () => {
  const store = storeFrom([edit('op-1')]);
  await syncEdits(store, async () => ({ id: 'another-operation' })).catch(() => {});
  assert.deepEqual(await store.read(), [edit('op-1')]);
});
test('acknowledgement preserves edits queued during the send', async () => {
  const store = storeFrom([edit('op-1')]);
  await syncEdits(store, async (operation) => {
    await store.write([...(await store.read()), edit('op-2')]);
    return { id: operation.id };
  });
  assert.deepEqual(await store.read(), [edit('op-2')]);
});
`,
      'README.md':
        'The outbox is shared app logic with a persistent storage adapter. Pending edits remain persisted through restart until send resolves with a matching id. Timeout may occur after the server applied an edit, so retries reuse the id. Run node --test; these fixtures cannot prove native storage durability or device lifecycle behavior.\n',
    },
    criteria: {
      baseline:
        'Runs the supplied tests before editing and identifies removal before acknowledgement as the data-loss cause.',
      durability:
        'Timeout/restart, including restart while send is pending, retains persisted edits with their original IDs; only matching acknowledgements remove them.',
      concurrency: 'Rejects mismatched acknowledgements and preserves an edit queued during send.',
      proof:
        'The original tests pass without weakening assertions; any additional checks protect the stated contract.',
      scope:
        'No server/UI/dependency changes or delegation; reports Node evidence separately from unverified native lifecycle/storage.',
    },
    loads: [{ skill: 'squad-mobile', task: 'offline-sync-and-lifecycle' }],
  },
  {
    id: 'devops-untrusted-pr',
    prompt:
      'Use squad-devops to repair .github/workflows/validate.yml so fork pull requests run the existing test command without secrets or write permissions. This workflow only validates; keep deployment separate. Preserve the pinned checkout action. Validate locally with available tools, without installing anything, opening PRs, pushing or deploying. Work directly with no delegation; report what cannot be established without a GitHub run.',
    files: {
      '.github/workflows/validate.yml': `name: Validate
on: pull_request_target
permissions:
  contents: write
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803
        with:
          ref: \${{ github.event.pull_request.head.sha }}
      - run: node --test
        env:
          DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}
`,
      'math.mjs': 'export const total = (items) => items.reduce((sum, value) => sum + value, 0);\n',
      'math.test.mjs':
        "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { total } from './math.mjs';\ntest('totals items', () => assert.equal(total([2, 3]), 5));\n",
    },
    criteria: {
      trigger:
        'Validates pull_request with no pull_request_target execution of contributor-controlled code.',
      permissions:
        'No stored secrets or write permissions reach the validation job; checkout does not persist credentials.',
      continuity:
        'Keeps the pinned checkout action and node --test, without introducing a deploy path.',
      evidence:
        'Runs local tests and inspects/parses the workflow as available; does not claim a hosted CI run or deployment.',
      scope:
        'No installs, delegation, push, PR or external mutation; gates are reported as logical passes when required.',
    },
    loads: [{ skill: 'squad-devops', task: 'pipeline-or-iac-change' }],
  },
];
