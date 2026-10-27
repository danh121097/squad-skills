import type { SkillEvaluationCase } from './skill-evaluation-cases.ts';
import { skillTaskTypes } from './skill-task-types.ts';

type Query = { id: string; split: 'train' | 'validation'; role: string | null; prompt: string };

// Fixed split: validation prompts are held out from description tuning.
const queries: Query[] = [
  {
    id: 'existing-form',
    split: 'train',
    role: 'squad-frontend',
    prompt:
      'Thêm loading, lỗi và retry cho form tìm kiếm trong src/search.tsx, dùng components/tokens đang có. UI đã chốt; giữ nguyên API. Làm trực tiếp, không delegate.',
  },
  {
    id: 'unsettled-flow',
    split: 'train',
    role: 'squad-designer',
    prompt:
      'Users get lost in our settings screen. Redesign its grouping and navigation using the existing design system; no approved layout exists yet. Leave application data and routing wiring to the builder.',
  },
  {
    id: 'checkout-states',
    split: 'validation',
    role: 'squad-frontend',
    prompt:
      'Wire the accepted checkout components to the published cart contract, including expired-session and failed-payment states. Keep their visual design and existing libraries. Work in this chat.',
  },
  {
    id: 'mobile-hierarchy',
    split: 'validation',
    role: 'squad-designer',
    prompt:
      'Màn hình lịch sử giao dịch mobile quá khó đọc. Hãy quyết định lại phân cấp và cách mở chi tiết, dùng theme hiện tại; phần dữ liệu sẽ được nối sau.',
  },
  {
    id: 'vague-idea',
    split: 'train',
    role: 'squad-product',
    prompt:
      'Tôi muốn một công cụ giúp đội mua hàng giảm thất lạc yêu cầu. Chưa rõ MVP cần những gì; giúp chốt phạm vi và tiêu chí thành công trước, chưa code.',
  },
  {
    id: 'accepted-delivery',
    split: 'train',
    role: 'squads-team',
    prompt:
      'Implement the accepted requests feature: the API persists validated requests, the existing web form submits them and shows errors, and CI runs both suites. Stack and UI are fixed; coordinate backend, frontend and CI ownership. Work directly without delegating.',
  },
  {
    id: 'partly-framed',
    split: 'validation',
    role: 'squad-product',
    prompt:
      'React and PostgreSQL are already chosen for our supplier portal. Before building, help define what the first release includes, who can approve requests, and observable acceptance criteria. Keep the settled stack.',
  },
  {
    id: 'cross-role-rollout',
    split: 'validation',
    role: 'squads-team',
    prompt:
      'Triển khai kế hoạch đã duyệt: backend thêm bộ lọc ngày theo contract, frontend nối bộ lọc vào URL, DevOps cập nhật cấu hình preview. Tiêu chí: giữ tương thích client cũ và các test hiện có pass. Làm trực tiếp, không mở agent khác.',
  },
  {
    id: 'unknown-failure',
    split: 'train',
    role: 'squad-fix',
    prompt:
      'Sau deploy, nút lưu lúc được lúc báo 502. Chưa biết do browser, API hay proxy. Hãy tìm nguyên nhân có bằng chứng rồi sửa trong session này.',
  },
  {
    id: 'new-endpoint',
    split: 'train',
    role: 'squad-backend',
    prompt:
      'Add cursor pagination to the orders endpoint using the existing service and schema. The accepted contract is { items, nextCursor }; preserve auth and define the boundary tests. Work directly.',
  },
  {
    id: 'intermittent-ci',
    split: 'validation',
    role: 'squad-fix',
    prompt:
      'The integration suite began timing out after yesterday’s merge, but rerunning sometimes passes. Diagnose the first causal failure before changing code; do not just increase timeouts.',
  },
  {
    id: 'new-webhook',
    split: 'validation',
    role: 'squad-backend',
    prompt:
      'Thêm webhook nhận cập nhật vận chuyển trong service hiện tại, có kiểm tra chữ ký và chống xử lý trùng theo event ID. Đây là tính năng mới, không có lỗi đang điều tra. Làm trực tiếp.',
  },
  {
    id: 'execute-acceptance',
    split: 'train',
    role: 'squad-qa',
    prompt:
      'The checkout change is ready. Run acceptance and regression checks for declined payment, retry and duplicate clicks; return reproducible failures and coverage gaps. Do not modify production code.',
  },
  {
    id: 'inspect-diff',
    split: 'train',
    role: 'squad-code-review',
    prompt:
      'Review the pending diff for races and compatibility regressions. QA has supplied passing evidence for this exact diff. Verify concrete findings and report file/line, without implementing fixes or replaying the whole suite.',
  },
  {
    id: 'device-evidence',
    split: 'validation',
    role: 'squad-qa',
    prompt:
      'Kiểm chứng bản sửa deep link: cold start, hết phiên đăng nhập và quay lại app. Chạy những kiểm tra môi trường này hỗ trợ, ghi rõ phần thiếu device; chỉ test và báo cáo.',
  },
  {
    id: 'migration-review',
    split: 'validation',
    role: 'squad-code-review',
    prompt:
      'Đọc diff migration và các caller để tìm nguy cơ mất dữ liệu hoặc rollback không tương thích. Evidence QA đã có; tôi cần review implementation, chưa sửa file.',
  },
  {
    id: 'translate-log',
    split: 'train',
    role: null,
    prompt: 'Dịch câu log "Connection closed by peer" sang tiếng Việt, chỉ dịch câu này.',
  },
  {
    id: 'git-question',
    split: 'train',
    role: null,
    prompt: 'What does git diff --stat show? Just explain briefly.',
  },
  {
    id: 'typo',
    split: 'validation',
    role: null,
    prompt: 'Trong README.md đổi đúng chữ "instalation" thành "installation", không sửa gì khác.',
  },
  {
    id: 'wording-question',
    split: 'validation',
    role: null,
    prompt:
      'Explain in one sentence what "offline mode" means to an app user; no code or design work.',
  },
];

const entrypoints = Object.keys(skillTaskTypes).map((role) => `skills/${role}/SKILL.md`);

export const routingEvaluationCases: SkillEvaluationCase[] = queries.map((query) => {
  const expected = query.role === null ? null : `skills/${query.role}/SKILL.md`;
  return {
    id: `routing-${query.id}`,
    split: query.split,
    prompt: query.prompt,
    setup:
      'Expose the complete squad discovery metadata in a fresh context, with unrelated skill packs disabled locally. Allow read-only scouting, then stop at the first squad SKILL.md activation or the first substantive answer/edit without one. Record the full skill-read trace; do not complete implementation. Give the agent only prompt.txt and workspace, never the evaluator rubric or split. Run validation queries only after freezing the candidate description.',
    files: {
      'README.md':
        query.id === 'typo'
          ? '# Setup\n\nRead the instalation guide.\n'
          : '# Existing application\n\nThe product has a React web client, Node service, PostgreSQL database and React Native mobile client. Shared components and tokens already exist. This routing fixture provides repository context; it is not a runnable application.\n',
    },
    criteria: {
      route:
        query.role === null
          ? 'Answers or performs the trivial requested change without activating any squad skill.'
          : `The first activated squad entrypoint is ${query.role}, based on the request rather than an evaluator hint.`,
      isolation:
        'No delegation, installation or external mutation; evaluator stops before substantive implementation for non-trivial tasks.',
    },
    reading: {
      required: expected === null ? [] : [expected],
      forbidden: entrypoints.filter((file) => file !== expected),
    },
    // Trigger-only trials have no completed-task reading path; zero is not observed token usage.
    loads: [],
  };
});
