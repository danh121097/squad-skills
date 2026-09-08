import { execFile as nodeExecFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

import {
  publishObservation,
  type PublishObservationOptions,
} from '../../scripts/feedback/publish-observation.ts';

const execFile = promisify(nodeExecFile);
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function repository(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'publish-observation-'));
  temporaryRoots.push(root);
  await execFile('git', ['init', '-b', 'main'], { cwd: root });
  await execFile('git', ['config', 'user.email', 'test@example.invalid'], { cwd: root });
  await execFile('git', ['config', 'user.name', 'Test'], { cwd: root });
  await writeFile(path.join(root, '.keep'), 'tracked\n', 'utf8');
  await execFile('git', ['add', '.keep'], { cwd: root });
  await execFile('git', ['commit', '-m', 'initial'], { cwd: root });
  await mkdir(path.join(root, 'plans', 'feedback', 'inbox'), { recursive: true });
  return root;
}

function options(repoRoot: string): PublishObservationOptions {
  return {
    repoRoot,
    file: 'plans/feedback/inbox/2026-09-08-example.md',
    publish: false,
  };
}

describe('publishObservation', () => {
  it('previews a publication without contacting a remote', async () => {
    const root = await repository();
    await writeFile(
      path.join(root, 'plans', 'feedback', 'inbox', '2026-09-08-example.md'),
      '- **Skill:** squad-qa 1.7.0\n- **Actual:** missed case\n',
      'utf8'
    );

    await expect(publishObservation(options(root))).resolves.toContain('Would open a draft PR');
  });

  it('refuses to publish when unrelated worktree changes exist', async () => {
    const root = await repository();
    await writeFile(
      path.join(root, 'plans', 'feedback', 'inbox', '2026-09-08-example.md'),
      '- **Skill:** squad-qa 1.7.0\n',
      'utf8'
    );
    await writeFile(path.join(root, 'unrelated.txt'), 'do not publish\n', 'utf8');

    await expect(publishObservation(options(root))).rejects.toThrow('unrelated changes');
  });
});
