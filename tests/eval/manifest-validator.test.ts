import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';

import { extractRegistryIds, validateEvalManifests } from '../../src/eval/manifest-validator.ts';
import {
  extractSection,
  hashContent,
  measureSkillPayload,
} from '../../src/eval/skill-payload-measurement.ts';

const temporaryDirectories: string[] = [];

// Deliberately not squad-designer: the engine reads which skills a cycle covers
// from the manifest, so a name hardcoded in code would fail this suite.
const budgetSkillName = 'primary-skill';
const skillNames = [budgetSkillName, 'secondary-skill'] as const;
const evalDirectory = path.join('evals', budgetSkillName);
const privateCommit = 'a'.repeat(40);

const contract = [
  '# Contract fixture',
  '',
  '| Id | Check |',
  '| --- | --- |',
  '| `INV-BUILD-001` | builds |',
  '| `INV-SCOPE-001` | stays in scope |',
  '',
  '| Id | Dimension |',
  '| --- | --- |',
  '| `RUB-HIER-001` | hierarchy |',
  '',
].join('\n');

const heldOutCase = 'id: acc-held-out\nlane: acceptance\n';

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('extractRegistryIds', () => {
  it('reads invariant and rubric ids from the human-authored contract', () => {
    expect([...extractRegistryIds(contract, 'INV')]).toEqual(['INV-BUILD-001', 'INV-SCOPE-001']);
    expect([...extractRegistryIds(contract, 'RUB')]).toEqual(['RUB-HIER-001']);
  });
});

describe('validateEvalManifests', () => {
  it('accepts a consistent contract and verifies the held-out store', async () => {
    const project = await createProject();

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors).toEqual([]);
    expect(result.directories).toEqual([budgetSkillName]);
    expect(result.notes.join('\n')).toContain('verified 1 of 1 held-out case hashes');
  });

  it('validates every contract under evals/ without naming any of them in code', async () => {
    const project = await createProject();
    await cp(
      path.join(project.root, evalDirectory),
      path.join(project.root, 'evals', 'another-skill'),
      { recursive: true }
    );
    await writeFile(
      path.join(project.root, 'evals', 'another-skill', 'baseline-manifest.yml'),
      'schema_version: 2\n',
      'utf8'
    );

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.directories).toEqual(['another-skill', budgetSkillName]);
    expect(
      result.errors.some((error) =>
        error.startsWith(path.join('evals', 'another-skill', 'baseline-manifest.yml'))
      )
    ).toBe(true);
  });

  it('passes without the private store and says the held-out half went unchecked', async () => {
    const project = await createProject();

    const result = await validateEvalManifests(project.root, { privatePath: null });

    expect(result.errors).toEqual([]);
    expect(result.notes.join('\n')).toContain('EVAL_PRIVATE_PATH is unset');
    expect(result.notes.join('\n')).toContain('1 private case hashes were not verified');
  });

  it('fails with the exact path when a manifest is malformed', async () => {
    const project = await createProject();
    await writeFile(
      path.join(project.root, evalDirectory, 'case-manifest.yml'),
      'cases: [\n',
      'utf8'
    );

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) =>
        error.startsWith(`${path.join(evalDirectory, 'case-manifest.yml')}: invalid YAML:`)
      )
    ).toBe(true);
  });

  it('rejects a held-out store that is readable from inside the repository', async () => {
    const project = await createProject();

    const result = await validateEvalManifests(project.root, { privatePath: 'evals' });

    expect(
      result.errors.some((error) => error.includes('must resolve outside the repository'))
    ).toBe(true);
  });

  it('rejects a held-out store reachable through a symlink back into the repository', async () => {
    const project = await createProject();
    const link = path.join(project.privateRoot, 'looks-external');
    await symlink(path.join(project.root, 'evals'), link, 'dir');

    const result = await validateEvalManifests(project.root, { privatePath: link });

    expect(
      result.errors.some((error) => error.includes('must resolve outside the repository'))
    ).toBe(true);
  });

  it('accepts a sibling store whose path merely starts with the repository path', async () => {
    const project = await createProject();
    // `<root>..holdout` is a different directory; a prefix test would reject it.
    const sibling = `${project.root}..holdout`;
    temporaryDirectories.push(sibling);
    await cp(project.privateRoot, sibling, { recursive: true });

    const result = await validateEvalManifests(project.root, { privatePath: sibling });

    expect(result.errors).toEqual([]);
  });

  it('reports a held-out path that does not exist instead of silently skipping it', async () => {
    const project = await createProject();

    const result = await validateEvalManifests(project.root, {
      privatePath: path.join(project.privateRoot, 'absent'),
    });

    expect(result.errors.some((error) => error.includes('does not exist'))).toBe(true);
  });

  it('rejects a duplicate case id across lanes', async () => {
    const project = await createProject({
      mutateCases: (manifest) => {
        manifest.cases.push({ id: 'dev-public-case', lane: 'acceptance', content_hash: hash() });
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) => error.includes('duplicate case id "dev-public-case"'))
    ).toBe(true);
  });

  it('rejects any field on a held-out case beyond id, lane, and content_hash', async () => {
    const project = await createProject({
      mutateCases: (manifest) => {
        manifest.cases[1].request = 'build the held-out billing panel';
        // An unknown key leaks just as much as a known one.
        manifest.cases[1].notes_for_judge = 'prefer the dense table';
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some(
        (error) =>
          error.includes('may only carry id, lane, and content_hash') &&
          error.includes('notes_for_judge, request')
      )
    ).toBe(true);
  });

  it('rejects invariant and rubric ids the contract does not define', async () => {
    const project = await createProject({
      mutateCases: (manifest) => {
        manifest.cases[0].hard_invariants = [{ id: 'INV-INVENTED-001', severity: 'critical' }];
        manifest.cases[0].qualitative_rubric = ['RUB-INVENTED-001'];
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors.some((error) => error.includes('INV-INVENTED-001'))).toBe(true);
    expect(result.errors.some((error) => error.includes('RUB-INVENTED-001'))).toBe(true);
  });

  it('rejects a public case whose required fields are present but empty', async () => {
    const project = await createProject({
      mutateCases: (manifest) => {
        manifest.cases[0].request = '   ';
        manifest.cases[0].evidence_packet = [];
        manifest.cases[0].expected_source_decisions = null;
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    for (const field of ['request', 'evidence_packet', 'expected_source_decisions']) {
      expect(result.errors.some((error) => error.includes(`missing a usable ${field}`))).toBe(true);
    }
  });

  it('rejects a config that is not a mapping instead of accepting it silently', async () => {
    const project = await createProject({
      mutateCases: (manifest) => {
        manifest.cases[0].config = 'codex + opus';
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors.some((error) => error.includes('needs config to be a mapping'))).toBe(
      true
    );
  });

  it('fails when a recorded measurement no longer reproduces from the working tree', async () => {
    const project = await createProject();
    await writeFile(
      path.join(project.root, 'skills', budgetSkillName, 'references', 'alpha.md'),
      'drifted content added after the freeze\n',
      'utf8'
    );

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors.some((error) => error.includes('reference_words'))).toBe(true);
    expect(result.errors.some((error) => error.includes('payload_hash'))).toBe(true);
    expect(result.errors.some((error) => error.includes('budget.median_loaded_words'))).toBe(true);
  });

  it('fails when a skill stops declaring a version rather than skipping the comparison', async () => {
    const project = await createProject();
    const entrypoint = path.join(project.root, 'skills', budgetSkillName, 'SKILL.md');
    const source = await readFile(entrypoint, 'utf8');
    await writeFile(entrypoint, source.replace(/^metadata:\n  version: .*\n/m, ''), 'utf8');

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) => error.includes('declares no string metadata.version'))
    ).toBe(true);
  });

  it('names the routing fault when a task type routes to a reference that vanished', async () => {
    const project = await createProject();
    await rm(path.join(project.root, 'skills', budgetSkillName, 'references', 'beta.md'));

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) =>
        error.includes('measurement failed: Task type "wide" routes to unknown reference "beta.md"')
      )
    ).toBe(true);
  });

  it('fails when the budget names a skill the manifest does not cover', async () => {
    const project = await createProject({
      mutateBaseline: (manifest) => {
        manifest.budget.skill = 'not-recorded';
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) => error.includes('budget.skill "not-recorded" is not recorded'))
    ).toBe(true);
  });

  it('enforces phase_1_reference as a ceiling on the governing budget', async () => {
    const project = await createProject({
      mutateBaseline: (manifest) => {
        manifest.phase_1_reference = {
          [budgetSkillName]: { entrypoint_words: 1, median_loaded_words: 1 },
        };
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) =>
        error.includes(`phase_1_reference.${budgetSkillName}.entrypoint_words`)
      )
    ).toBe(true);
    expect(
      result.errors.some((error) =>
        error.includes(`phase_1_reference.${budgetSkillName}.median_loaded_words`)
      )
    ).toBe(true);
  });

  it('accepts a budget at or below the phase_1_reference ceiling and rejects a malformed one', async () => {
    const project = await createProject({
      mutateBaseline: (manifest) => {
        manifest.phase_1_reference = {
          [budgetSkillName]: {
            entrypoint_words: manifest.budget.entrypoint_words,
            median_loaded_words: 'not-a-number',
          },
        };
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) =>
        error.includes(`phase_1_reference.${budgetSkillName}.entrypoint_words`)
      )
    ).toBe(false);
    expect(
      result.errors.some((error) =>
        error.includes(`phase_1_reference.${budgetSkillName}.median_loaded_words must be a number`)
      )
    ).toBe(true);
  });

  it('fails when a single reference is over budget.max_reference_words', async () => {
    const project = await createProject({
      mutateBaseline: (manifest) => {
        manifest.budget.max_reference_words = 2;
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    // alpha.md is two words and stays inside the cap; beta.md is three.
    expect(
      result.errors.some(
        (error) => error.includes('budget.max_reference_words') && error.includes('beta.md')
      )
    ).toBe(true);
    expect(result.errors.some((error) => error.includes('alpha.md'))).toBe(false);
  });

  it('rejects a missing or malformed budget.max_reference_words', async () => {
    for (const cap of [undefined, 0, -1, 1.5, '1000']) {
      const project = await createProject({
        mutateBaseline: (manifest) => {
          if (cap === undefined) delete manifest.budget.max_reference_words;
          else manifest.budget.max_reference_words = cap;
        },
      });

      const result = await validateEvalManifests(project.root, {
        privatePath: project.privateRoot,
      });

      expect(
        result.errors.some((error) =>
          error.includes('budget.max_reference_words must be a positive integer')
        )
      ).toBe(true);
    }
  });

  it('rejects a phase_1_reference block that omits the budget skill', async () => {
    const project = await createProject({
      mutateBaseline: (manifest) => {
        manifest.phase_1_reference = {
          'renamed-skill': { entrypoint_words: 1, median_loaded_words: 1 },
        };
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some(
        (error) =>
          error.includes('phase_1_reference is present but has no entry') &&
          error.includes(budgetSkillName)
      )
    ).toBe(true);
  });

  it('fails when the private commit hash is not a full commit', async () => {
    const project = await createProject({
      mutateBaseline: (manifest) => {
        manifest.private_store.commit = 'abc1234';
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) => error.includes('private_store.commit must be a full'))
    ).toBe(true);
  });

  it('fails when a reference is routed by no task type', async () => {
    const project = await createProject({
      mutateBaseline: (manifest) => {
        manifest.task_types = manifest.task_types.filter(
          (taskType: { references: string[] }) => !taskType.references.includes('beta.md')
        );
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors.some((error) => error.includes('no task type routes to beta.md'))).toBe(
      true
    );
  });

  it('fails when a held-out case changed or disappeared from the store', async () => {
    const changed = await createProject();
    await writeFile(
      path.join(changed.privateRoot, 'cases', 'acceptance', 'acc-held-out.yml'),
      `${heldOutCase}category: tampered\n`,
      'utf8'
    );

    const changedResult = await validateEvalManifests(changed.root, {
      privatePath: changed.privateRoot,
    });

    expect(
      changedResult.errors.some((error) => error.includes('changed in the held-out store'))
    ).toBe(true);

    const missing = await createProject();
    await rm(path.join(missing.privateRoot, 'cases', 'acceptance', 'acc-held-out.yml'));

    const missingResult = await validateEvalManifests(missing.root, {
      privatePath: missing.privateRoot,
    });

    expect(
      missingResult.errors.some((error) => error.includes('missing from the held-out store'))
    ).toBe(true);
  });

  it('fails when the held-out store grew a case the manifest never registered', async () => {
    const project = await createProject();
    await writeFile(
      path.join(project.privateRoot, 'cases', 'acceptance', 'acc-smuggled-in.yml'),
      'id: acc-smuggled-in\nlane: acceptance\n',
      'utf8'
    );

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors.some((error) => error.includes('grew in the held-out store'))).toBe(true);
  });

  it('refuses a case body that is a symlink pointing out of the store', async () => {
    const project = await createProject();
    const casePath = path.join(project.privateRoot, 'cases', 'acceptance', 'acc-held-out.yml');
    const elsewhere = await mkdtemp(path.join(tmpdir(), 'squad-skills-elsewhere-'));
    temporaryDirectories.push(elsewhere);
    const moved = path.join(elsewhere, 'acc-held-out.yml');
    await cp(casePath, moved);
    await rm(casePath);
    // The lane directory is still contained and the body still reads; only the
    // file inside it now points out of the store.
    await symlink(moved, casePath);

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(
      result.errors.some((error) => error.includes('resolves outside the held-out store'))
    ).toBe(true);
  });

  it('refuses a lane source that is a symlink pointing out of the store', async () => {
    const project = await createProject();
    const lanePath = path.join(project.privateRoot, 'cases', 'acceptance');
    const elsewhere = await mkdtemp(path.join(tmpdir(), 'squad-skills-elsewhere-'));
    temporaryDirectories.push(elsewhere);
    await cp(lanePath, elsewhere, { recursive: true });
    await rm(lanePath, { recursive: true });
    // Spelled as a plain child of the store, so the path as written is contained
    // and every case body is still readable through it.
    await symlink(elsewhere, lanePath);

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors.some((error) => error.includes('no usable source path'))).toBe(true);
  });

  it('fails when the held-out store is not parked on the pinned commit', async () => {
    const project = await createProject();
    await writeGitHead(project.privateRoot, 'b'.repeat(40));

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors.some((error) => error.includes('the cycle is no longer frozen'))).toBe(
      true
    );
  });

  it('accepts a held-out store parked on the pinned commit', async () => {
    const project = await createProject();
    await writeGitHead(project.privateRoot, privateCommit);

    const result = await validateEvalManifests(project.root, { privatePath: project.privateRoot });

    expect(result.errors).toEqual([]);
  });

  it('fails when the judge shares the subject provider family', async () => {
    const project = await createProject({
      mutateBaseline: (baseline) => {
        baseline.judging.judge = { provider: 'openai', model: 'o5' };
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: null });

    expect(result.errors.some((error) => error.includes('same family'))).toBe(true);
  });

  it('fails when a case pins a model the cycle did not', async () => {
    const project = await createProject({
      mutateCases: (cases) => {
        cases.cases[0].config.judge.model = 'claude-sonnet-5';
      },
    });

    const result = await validateEvalManifests(project.root, { privatePath: null });

    expect(result.errors.some((error) => error.includes('not the cycle'))).toBe(true);
  });
});

interface ProjectFixture {
  privateRoot: string;
  root: string;
}

// Fixtures build and mutate loosely typed manifests on purpose, so negative
// cases can break one field at a time without fighting the schema types.
type MutableManifest = Record<string, any>;

async function createProject(
  options: {
    mutateBaseline?: (manifest: MutableManifest) => void;
    mutateCases?: (manifest: MutableManifest) => void;
  } = {}
): Promise<ProjectFixture> {
  const root = await mkdtemp(path.join(tmpdir(), 'squad-skills-evals-'));
  const privateRoot = await mkdtemp(path.join(tmpdir(), 'squad-skills-held-out-'));
  temporaryDirectories.push(root, privateRoot);

  await writeSkill(root, budgetSkillName, '1.3.0', {
    'alpha.md': 'alpha body\n',
    'beta.md': 'beta body here\n',
  });
  await writeSkill(root, 'secondary-skill', '1.4.0', {});

  await mkdir(path.join(privateRoot, 'cases', 'acceptance'), { recursive: true });
  await writeFile(
    path.join(privateRoot, 'cases', 'acceptance', 'acc-held-out.yml'),
    heldOutCase,
    'utf8'
  );

  const taskTypes = [
    { id: 'wide', references: ['alpha.md', 'beta.md'] },
    { id: 'narrow', references: ['alpha.md'] },
    { id: 'other', references: ['beta.md'] },
  ];

  const baseline: MutableManifest = {
    schema_version: 1,
    runtime: { node: '22.20.0', pnpm: '10.17.1', gate_command: 'pnpm test', gate_status: 'green' },
    private_store: {
      env_var: 'EVAL_PRIVATE_PATH',
      repository: 'owner/held-out',
      visibility: 'private',
      commit: privateCommit,
    },
    skills: {},
    task_types: [],
    // The fixture declares a paid lane, so the pinned judging contract is
    // required here for the same reason it is in the real manifest.
    judging: {
      subject: { provider: 'codex', model: 'gpt-5.6-sol' },
      judge: { provider: 'anthropic', model: 'claude-opus-5' },
      authoring_assistance: 'maintainer plus interactive assistance',
      temperature_control: 'unavailable on the judge',
      subject_sanity_subset: {
        provider: 'anthropic',
        model: 'claude-sonnet-5',
        cases: 6,
        judged: false,
      },
      paid_lanes: ['acceptance'],
      promotion_lane: 'acceptance',
      length_control: { acceptance: 'acc-held-out' },
      budget: { estimated_usd_per_cycle: '15-25', hard_stop_usd: 150 },
      thresholds: {
        registered: false,
        equivalence_boundary: 0,
        minimum_judge_human_agreement: 0.7,
        minimum_calibration_pairs: 6,
        bootstrap_seed: 1,
      },
    },
    budget: {},
  };

  for (const skillName of skillNames) {
    const skillRoot = path.join(root, 'skills', skillName);
    const measurement = await measureSkillPayload({
      skillRoot,
      taskTypes: skillName === budgetSkillName ? taskTypes : [],
    });
    const boundary = extractSection(await readSkill(skillRoot), '## Scope and boundary') ?? '';

    baseline.skills[skillName] = {
      version: skillName === budgetSkillName ? '1.3.0' : '1.4.0',
      payload_hash: measurement.payloadHash,
      boundary_hash: hashContent(boundary),
      entrypoint_words: measurement.entrypointWords,
      reference_count: measurement.referenceCount,
      reference_words: measurement.referenceWords,
      total_payload_words: measurement.totalPayloadWords,
    };

    if (skillName !== budgetSkillName) continue;

    baseline.task_types = measurement.taskLoads.map((taskLoad) => ({
      id: taskLoad.id,
      references: taskLoad.references,
      loaded_words: taskLoad.loadedWords,
    }));
    baseline.budget = {
      skill: budgetSkillName,
      entrypoint_words: measurement.entrypointWords,
      median_loaded_words: measurement.medianLoadedWords,
      max_reference_words: 100,
    };
  }

  const cases: MutableManifest = {
    schema_version: 1,
    lanes: {
      development: { visibility: 'public', paid_judging: false, frozen: false },
      acceptance: {
        visibility: 'private',
        paid_judging: true,
        frozen: true,
        source: 'cases/acceptance',
      },
    },
    categories: ['web-component'],
    cases: [
      {
        id: 'dev-public-case',
        lane: 'development',
        category: 'web-component',
        target_platform: 'web',
        output_type: 'presentational-code',
        request: 'build a presentational card',
        evidence_packet: ['token file'],
        allowed_capabilities: ['repository read'],
        hard_invariants: [
          { id: 'INV-BUILD-001', severity: 'critical' },
          { id: 'INV-SCOPE-001', severity: 'high' },
        ],
        qualitative_rubric: ['RUB-HIER-001'],
        expected_source_decisions: ['reuse the existing card primitive'],
        seed: 1,
        config: {
          subject: { provider: 'codex', model: 'gpt-5.6-sol' },
          judge: { provider: 'anthropic', model: 'claude-opus-5' },
        },
      },
      { id: 'acc-held-out', lane: 'acceptance', content_hash: hashContent(heldOutCase) },
    ],
  };

  options.mutateBaseline?.(baseline);
  options.mutateCases?.(cases);

  await mkdir(path.join(root, evalDirectory), { recursive: true });
  await writeFile(path.join(root, evalDirectory, 'eval-contract.md'), contract, 'utf8');
  await writeFile(
    path.join(root, evalDirectory, 'baseline-manifest.yml'),
    stringify(baseline),
    'utf8'
  );
  await writeFile(path.join(root, evalDirectory, 'case-manifest.yml'), stringify(cases), 'utf8');

  return { privateRoot, root };
}

async function writeSkill(
  root: string,
  name: string,
  version: string,
  references: Record<string, string>
): Promise<void> {
  const skillRoot = path.join(root, 'skills', name);
  await mkdir(skillRoot, { recursive: true });
  await writeFile(
    path.join(skillRoot, 'SKILL.md'),
    [
      '---',
      `name: ${name}`,
      'description: fixture skill',
      'metadata:',
      `  version: "${version}"`,
      '---',
      '',
      `# ${name}`,
      '',
      '## Scope and boundary',
      '',
      `Owned by ${name} and nothing else.`,
      '',
    ].join('\n'),
    'utf8'
  );

  if (Object.keys(references).length === 0) return;

  await mkdir(path.join(skillRoot, 'references'), { recursive: true });

  for (const [file, content] of Object.entries(references)) {
    await writeFile(path.join(skillRoot, 'references', file), content, 'utf8');
  }
}

/** Minimal git metadata: enough for the commit check, without running git. */
async function writeGitHead(worktreeRoot: string, commit: string): Promise<void> {
  const gitDirectory = path.join(worktreeRoot, '.git');

  await mkdir(path.join(gitDirectory, 'refs', 'heads'), { recursive: true });
  await writeFile(path.join(gitDirectory, 'HEAD'), 'ref: refs/heads/develop\n', 'utf8');
  await writeFile(path.join(gitDirectory, 'refs', 'heads', 'develop'), `${commit}\n`, 'utf8');
}

async function readSkill(skillRoot: string): Promise<string> {
  return readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
}

function hash(): string {
  return `sha256:${'0'.repeat(64)}`;
}
