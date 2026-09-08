import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, normalize, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const DAILY_REPORT_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const INBOX_GLOB = 'plans/feedback/inbox/*.md';
const DAILY_REPORT_GLOB = 'plans/feedback/daily/*.md';
const README_FILE = 'README.md';
const UNKNOWN = 'unknown';
const MAX_FIELD_LENGTH = 6_000;

export type FeedbackFields = {
  skillVersion: string;
  taskStack: string;
  expected: string;
  actual: string;
  evidence: string;
  candidateRule: string;
  dispositionOutcome: string;
};

export type FeedbackRecord = {
  sourceKey: string;
  sourceLabel: string;
  sourceUrl?: string;
  sourceDate?: string;
  fields: FeedbackFields;
};

export type GithubFeedbackIssue = {
  number: number;
  title?: string;
  body?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  labels?: Array<{ name?: string }>;
};

export type SummaryWindow = {
  reportDate: string;
  windowStart: Date;
  windowEnd: Date;
};

type FieldKey = keyof FeedbackFields | 'runtime';

type TrackedInboxFile = {
  path: string;
  committedAt: Date;
};

type CliOptions = {
  issuesPath: string;
  outputPath?: string;
  outputDirectory?: string;
  now: Date;
  repoRoot: string;
  githubOutputPath?: string;
  priorReportPath?: string;
};

const FIELD_ALIASES: Record<FieldKey, string[]> = {
  skillVersion: ['skill', 'skill and version', 'skill/version', 'which skill', 'version'],
  runtime: ['runtime and model'],
  taskStack: ['task', 'task and stack', 'task/stack', 'the task and the stack'],
  expected: ['expected', 'what you expected'],
  actual: ['actual', 'missed', 'what you got'],
  evidence: ['evidence', 'evidence someone else can open', 'shareable evidence'],
  candidateRule: [
    'candidate rule',
    'a rule that would have prevented it',
    'a rule that would have prevented it (optional)',
  ],
  dispositionOutcome: ['disposition', 'disposition/outcome', 'outcome'],
};

const ALIAS_TO_FIELD = new Map<string, FieldKey>(
  Object.entries(FIELD_ALIASES).flatMap(([key, aliases]) =>
    aliases.map((alias) => [normaliseLabel(alias), key as FieldKey])
  )
);

const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN [^-\n]*PRIVATE KEY-----[\s\S]*?-----END [^-\n]*PRIVATE KEY-----/gi,
  /\b(?:ghp|gho|ghs|ghr|github_pat|xox[baprs]-)[A-Za-z0-9_-]{12,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b(?:sk-[A-Za-z0-9_-]{16,}|AIza[A-Za-z0-9_-]{20,})\b/g,
];

const KEY_VALUE_SECRET_PATTERN =
  /\b(password|passwd|secret|token|api[_ -]?key|access[_ -]?token|private[_ -]?key)\b\s*[:=]\s*[^\s\n`]+/gi;

const LOCAL_PATH_PATTERNS: RegExp[] = [
  /(?:\/private)?\/var\/folders\/[^\n<>"'`)]*/gi,
  /\/(?:Users|home)\/[^\n<>"'`)]*/gi,
  /\b[A-Za-z]:[\\/]Users[\\/][^\n<>"'`)]*/gi,
  /~\/(?:\.|Library|Documents|Desktop|Downloads|Users)[^\n<>"'`)]*/gi,
];

const ANSI_PATTERN = /\u001b\[[0-?]*[ -\/]*[@-~]/g;
const CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

function normaliseLabel(value: string): string {
  return value
    .replace(/[*_`]/g, '')
    .replace(/[：:]\s*$/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normaliseNewlines(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function redactSensitiveText(value: string): string {
  let redacted = normaliseNewlines(value).replace(ANSI_PATTERN, '').replace(CONTROL_PATTERN, '');

  for (const pattern of SECRET_PATTERNS) redacted = redacted.replace(pattern, '[REDACTED_SECRET]');

  redacted = redacted.replace(KEY_VALUE_SECRET_PATTERN, '$1: [REDACTED_SECRET]');

  for (const pattern of LOCAL_PATH_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED_LOCAL_PATH]');
  }

  return redacted;
}

export function sanitizeFeedbackText(value: string | undefined): string {
  if (!value) return UNKNOWN;

  const redacted = redactSensitiveText(value).trim();
  if (!redacted) return UNKNOWN;
  if (redacted.length <= MAX_FIELD_LENGTH) return redacted;

  return `${redacted.slice(0, MAX_FIELD_LENGTH - 24).trimEnd()} [TRUNCATED]`;
}

function fieldFromHeading(line: string): { key: FieldKey; value: string } | undefined {
  const match = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*$/);
  if (!match) return undefined;

  const key = ALIAS_TO_FIELD.get(normaliseLabel(match[1] ?? ''));
  return key ? { key, value: '' } : undefined;
}

function fieldFromColon(line: string): { key: FieldKey; value: string } | undefined {
  const withoutBullet = line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '');
  const colonIndex = withoutBullet.indexOf(':');
  if (colonIndex < 0) return undefined;

  const label = withoutBullet
    .slice(0, colonIndex)
    .replace(/^\s*(?:\*\*|__)/, '')
    .replace(/(?:\*\*|__)\s*$/, '')
    .trim();
  const value = withoutBullet
    .slice(colonIndex + 1)
    .replace(/^\s*(?:\*\*|__)/, '')
    .replace(/(?:\*\*|__)\s*$/, '')
    .trim();
  const key = ALIAS_TO_FIELD.get(normaliseLabel(label));
  return key ? { key, value } : undefined;
}

function valuesToFields(values: Map<FieldKey, string[]>): FeedbackFields {
  const valueFor = (key: FieldKey): string => {
    const value = values.get(key)?.join('\n').trim() ?? '';
    return sanitizeFeedbackText(value);
  };

  const skillParts = values.get('skillVersion') ?? [];
  const skillVersion = sanitizeFeedbackText(skillParts.join('\n').trim());

  return {
    skillVersion,
    taskStack: valueFor('taskStack'),
    expected: valueFor('expected'),
    actual: valueFor('actual'),
    evidence: valueFor('evidence'),
    candidateRule: valueFor('candidateRule'),
    dispositionOutcome: valueFor('dispositionOutcome'),
  };
}

/**
 * Parse both the inbox convention (`- **Skill:** ...`) and GitHub issue-form
 * headings (`### Which skill`). All parsed material remains data; this parser
 * never evaluates Markdown, links, or commands found in a report.
 */
export function extractFeedbackFields(markdown: string): FeedbackFields {
  const values = new Map<FieldKey, string[]>();
  let activeKey: FieldKey | undefined;

  for (const line of normaliseNewlines(markdown).split('\n')) {
    const marker = fieldFromHeading(line) ?? fieldFromColon(line);

    if (marker) {
      activeKey = marker.key;
      const current = values.get(marker.key) ?? [];
      if (marker.value) current.push(marker.value);
      values.set(marker.key, current);
      continue;
    }

    if (activeKey) values.get(activeKey)?.push(line);
  }

  return valuesToFields(values);
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

function datePartsInTimeZone(date: Date, timeZone: string): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  );
}

export function formatReportDate(date: Date, timeZone = DAILY_REPORT_TIME_ZONE): string {
  const parts = datePartsInTimeZone(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isSafeRelativePath(path: string): boolean {
  if (isAbsolute(path)) return false;
  const resolved = normalize(path);
  return (
    resolved !== '..' && !resolved.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
  );
}

async function gitTrackedPaths(repoRoot: string, pattern: string): Promise<string[]> {
  const { stdout } = await execFileAsync('git', ['ls-files', '-z', '--', pattern], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return String(stdout)
    .split('\0')
    .filter((path) => path && isSafeRelativePath(path));
}

async function latestCommitDate(repoRoot: string, path: string): Promise<Date | undefined> {
  const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%cI', '--', path], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return parseDate(String(stdout).trim());
}

async function readTrackedInboxFiles(repoRoot: string): Promise<TrackedInboxFile[]> {
  const paths = await gitTrackedPaths(repoRoot, INBOX_GLOB);
  const files: TrackedInboxFile[] = [];

  for (const path of paths) {
    if (basename(path) === README_FILE) continue;
    const committedAt = await latestCommitDate(repoRoot, path);
    if (committedAt) files.push({ path, committedAt });
  }

  return files;
}

async function latestTrackedDailyReport(repoRoot: string): Promise<string | undefined> {
  const paths = (await gitTrackedPaths(repoRoot, DAILY_REPORT_GLOB)).filter(
    (path) => basename(path) !== README_FILE
  );

  return paths.sort().at(-1);
}

function parseWindowEnd(report: string): Date | undefined {
  const match = report.match(/^\s*-\s*\*\*Window end \(UTC\):\*\*\s*(\S+)\s*$/im);
  return parseDate(match?.[1]);
}

function reportDateFromPath(path: string): Date | undefined {
  const match = basename(path).match(/^(\d{4})-(\d{2})-(\d{2})\.md$/);
  if (!match) return undefined;

  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T17:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

export async function findPriorReport(
  repoRoot: string,
  explicitPath?: string
): Promise<{ path?: string; windowEnd?: Date }> {
  const path = explicitPath ?? (await latestTrackedDailyReport(repoRoot));
  if (!path) return {};

  const absolutePath = isAbsolute(path) ? path : join(repoRoot, path);
  const report = await readFile(absolutePath, 'utf8');
  return {
    path,
    windowEnd: parseWindowEnd(report) ?? reportDateFromPath(path),
  };
}

export function isSkillFeedbackIssue(issue: GithubFeedbackIssue): boolean {
  if (!issue.labels) return false;
  return issue.labels.some(({ name }) => name?.trim().toLowerCase() === 'skill-feedback');
}

function normaliseIssue(value: unknown): GithubFeedbackIssue | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const issue = value as Record<string, unknown>;
  const number = typeof issue.number === 'number' ? issue.number : Number(issue.number);
  if (!Number.isInteger(number) || number < 1) return undefined;

  const labels = Array.isArray(issue.labels)
    ? issue.labels.flatMap((label) => {
        if (!label || typeof label !== 'object') return [];
        const name = (label as Record<string, unknown>).name;
        return typeof name === 'string' ? [{ name }] : [];
      })
    : undefined;

  return {
    number,
    title: typeof issue.title === 'string' ? issue.title : undefined,
    body: typeof issue.body === 'string' ? issue.body : undefined,
    url: typeof issue.url === 'string' ? issue.url : undefined,
    createdAt: typeof issue.createdAt === 'string' ? issue.createdAt : undefined,
    updatedAt: typeof issue.updatedAt === 'string' ? issue.updatedAt : undefined,
    labels,
  };
}

export function parseGithubFeedbackIssues(input: string): GithubFeedbackIssue[] {
  const parsed: unknown = JSON.parse(input);
  if (!Array.isArray(parsed)) throw new Error('The GitHub issue payload must be a JSON array.');

  return parsed
    .map(normaliseIssue)
    .filter((issue): issue is GithubFeedbackIssue => Boolean(issue))
    .filter(isSkillFeedbackIssue);
}

export function issueToFeedbackRecord(
  issue: GithubFeedbackIssue,
  repository?: string
): FeedbackRecord {
  const fields = extractFeedbackFields(issue.body ?? '');
  const runtime = extractFieldValue(issue.body, ['runtime and model']);
  const skillVersion =
    fields.skillVersion === UNKNOWN
      ? UNKNOWN
      : runtime === UNKNOWN
        ? fields.skillVersion
        : `${fields.skillVersion}\nRuntime/model: ${runtime}`;

  const sourceUrl = safeIssueUrl(issue.url, repository, issue.number);
  return {
    sourceKey: `issue:${issue.number}`,
    sourceLabel: `Issue #${issue.number}${issue.title ? ` — ${inlineText(issue.title)}` : ''}`,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...((parseDate(issue.updatedAt) ?? parseDate(issue.createdAt))
      ? { sourceDate: (parseDate(issue.updatedAt) ?? parseDate(issue.createdAt))?.toISOString() }
      : {}),
    fields: { ...fields, skillVersion },
  };
}

function extractFieldValue(markdown: string | undefined, aliases: string[]): string {
  const values: string[] = [];
  let active = false;
  const requestedLabels = new Set(aliases.map(normaliseLabel));

  for (const line of normaliseNewlines(markdown ?? '').split('\n')) {
    const marker = fieldFromHeading(line) ?? fieldFromColon(line);
    if (marker) {
      const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*$/);
      const colon = line
        .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '')
        .match(/^(?:\*\*|__)?\s*([^:*]+?)\s*(?:\*\*|__)?\s*:\s*(.*)$/);
      const label = heading?.[1] ?? colon?.[1] ?? '';
      active = requestedLabels.has(normaliseLabel(label));
      if (active && marker.value) values.push(marker.value);
      continue;
    }
    if (active) values.push(line);
  }

  return sanitizeFeedbackText(values.join('\n').trim());
}

function safeIssueUrl(
  url: string | undefined,
  repository: string | undefined,
  number: number
): string | undefined {
  const candidate =
    url ?? (repository ? `https://github.com/${repository}/issues/${number}` : undefined);
  if (!candidate) return undefined;

  try {
    const parsed = new URL(candidate);
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== 'github.com' ||
      parsed.username ||
      parsed.password
    ) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

async function inboxToFeedbackRecord(
  repoRoot: string,
  file: TrackedInboxFile
): Promise<FeedbackRecord> {
  const markdown = await readFile(join(repoRoot, file.path), 'utf8');
  return {
    sourceKey: `inbox:${file.path}`,
    sourceLabel: `Inbox: ${file.path}`,
    sourceDate: file.committedAt.toISOString(),
    fields: extractFeedbackFields(markdown),
  };
}

export async function collectNewFeedback(
  repoRoot: string,
  issues: GithubFeedbackIssue[],
  windowStart: Date,
  repository?: string
): Promise<FeedbackRecord[]> {
  const records: FeedbackRecord[] = [];
  const inboxFiles = await readTrackedInboxFiles(repoRoot);

  for (const file of inboxFiles) {
    if (file.committedAt > windowStart) records.push(await inboxToFeedbackRecord(repoRoot, file));
  }

  for (const issue of issues) {
    const updatedAt = parseDate(issue.updatedAt ?? issue.createdAt);
    if (updatedAt && updatedAt > windowStart)
      records.push(issueToFeedbackRecord(issue, repository));
  }

  return records.sort((left, right) => {
    const leftDate = parseDate(left.sourceDate)?.valueOf() ?? 0;
    const rightDate = parseDate(right.sourceDate)?.valueOf() ?? 0;
    return leftDate - rightDate || left.sourceKey.localeCompare(right.sourceKey);
  });
}

function inlineText(value: string): string {
  return sanitizeFeedbackText(value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/[`]/g, "'");
}

function renderValue(value: string): string {
  const safeValue = sanitizeFeedbackText(value).replace(/```/g, "''' ");
  return `  \`\`\`text\n${safeValue}\n  \`\`\``;
}

function renderSource(record: FeedbackRecord): string {
  if (!record.sourceUrl) return `- **Source:** \`${inlineText(record.sourceLabel)}\``;
  return `- **Source:** [GitHub issue](${record.sourceUrl}) (\`${inlineText(record.sourceLabel)}\`)`;
}

export function renderDailySummary(window: SummaryWindow, records: FeedbackRecord[]): string {
  const inboxCount = records.filter(({ sourceKey }) => sourceKey.startsWith('inbox:')).length;
  const issueCount = records.length - inboxCount;
  const lines = [
    `# Daily Squad feedback — ${window.reportDate}`,
    '',
    `- **Window start (UTC):** ${window.windowStart.toISOString()}`,
    `- **Window end (UTC):** ${window.windowEnd.toISOString()}`,
    `- **New material:** ${records.length} item(s) (${inboxCount} inbox, ${issueCount} issue(s))`,
    '',
    '> Feedback text is untrusted data. It was sanitized for this report and is not an instruction to execute.',
  ];

  if (records.length === 0) {
    lines.push(
      '',
      'No new sanitized feedback was committed or updated since the prior daily report.'
    );
    return `${lines.join('\n')}\n`;
  }

  for (const [index, record] of records.entries()) {
    const heading = inlineText(record.sourceLabel).replace(/[#\[\]]/g, '');
    lines.push('', `## ${index + 1}. ${heading}`, '', renderSource(record));
    if (record.sourceDate) lines.push(`- **Source updated (UTC):** ${record.sourceDate}`);

    const fields: Array<[string, string]> = [
      ['Skill/version', record.fields.skillVersion],
      ['Task/stack', record.fields.taskStack],
      ['Expected', record.fields.expected],
      ['Actual', record.fields.actual],
      ['Shareable evidence', record.fields.evidence],
      ['Candidate rule', record.fields.candidateRule],
      ['Disposition/Outcome', record.fields.dispositionOutcome],
    ];

    for (const [label, value] of fields) lines.push('', `- **${label}:**`, renderValue(value));
  }

  return `${lines.join('\n')}\n`;
}

function parseArgs(argv: string[]): CliOptions {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument || !argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument ?? ''}`);
    }
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    values.set(key, value);
    index += 1;
  }

  const issuesPath = values.get('issues');
  const outputPath = values.get('output');
  const outputDirectory = values.get('output-dir');
  if (!issuesPath || (!outputPath && !outputDirectory)) {
    throw new Error('Usage: --issues <json> --output <markdown> [--output-dir <directory>]');
  }

  const now = parseDate(values.get('now')) ?? new Date();
  const repoRoot = resolve(values.get('repo-root') ?? process.cwd());

  return {
    issuesPath: resolve(repoRoot, issuesPath),
    ...(outputPath ? { outputPath: resolve(repoRoot, outputPath) } : {}),
    ...(outputDirectory ? { outputDirectory: resolve(repoRoot, outputDirectory) } : {}),
    now,
    repoRoot,
    ...(values.get('github-output')
      ? { githubOutputPath: resolve(repoRoot, values.get('github-output')!) }
      : {}),
    ...(values.get('prior-report') ? { priorReportPath: values.get('prior-report') } : {}),
  };
}

async function writeGithubOutput(
  path: string | undefined,
  window: SummaryWindow,
  hasNewMaterial: boolean
): Promise<void> {
  if (!path) return;
  await appendFile(
    path,
    `report_date=${window.reportDate}\nwindow_start=${window.windowStart.toISOString()}\nwindow_end=${window.windowEnd.toISOString()}\nhas_new_material=${hasNewMaterial}\n`
  );
}

export async function run(
  options: CliOptions
): Promise<{ window: SummaryWindow; records: FeedbackRecord[] }> {
  const prior = await findPriorReport(options.repoRoot, options.priorReportPath);
  const window: SummaryWindow = {
    reportDate: formatReportDate(options.now),
    windowStart: prior.windowEnd ?? new Date(options.now.getTime() - 24 * 60 * 60 * 1000),
    windowEnd: options.now,
  };
  const issues = parseGithubFeedbackIssues(await readFile(options.issuesPath, 'utf8'));
  const records = await collectNewFeedback(
    options.repoRoot,
    issues,
    window.windowStart,
    process.env.GITHUB_REPOSITORY
  );
  const summary = renderDailySummary(window, records);
  const outputPath = options.outputPath
    ? options.outputPath
    : options.outputDirectory
      ? join(options.outputDirectory, `${window.reportDate}.md`)
      : undefined;
  if (!outputPath) throw new Error('A report output path or directory is required.');

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, summary, 'utf8');
  await writeGithubOutput(options.githubOutputPath, window, records.length > 0);

  return { window, records };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  await run(options);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedFile === currentFile) await main();
