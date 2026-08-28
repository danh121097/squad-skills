import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export interface ValidateWorkflowIsolationOptions {
  errors: string[];
  notes: string[];
  /**
   * Environment variable names that resolve the held-out store, read from each
   * baseline manifest's `private_store.env_var`. Derived rather than hard-coded
   * so renaming the variable cannot silently retire this check.
   */
  privateStoreEnvVars: Set<string>;
  projectRoot: string;
  /** Overridable so the rules can be exercised against a fixture directory. */
  workflowsDirectory?: string;
}

export const defaultWorkflowsDirectory = '.github/workflows';

/**
 * The only secret a public workflow may name. It is minted per run, scoped by
 * the workflow's own `permissions`, and is not a stored credential.
 */
const permittedSecret = 'GITHUB_TOKEN';

const secretReferencePattern = /secrets\.([A-Za-z_][A-Za-z0-9_]*)/g;
const commentPattern = /(^|\s)#.*$/gm;

/**
 * Proves that no continuous-integration path can reach the held-out acceptance
 * set, and that contributed content is never processed with repository secrets.
 *
 * The repository takes public contributions, so a pull request runs workflow
 * code the maintainer did not write. Three properties keep that safe, and all
 * three are the kind of thing that decays quietly in a YAML file nobody
 * re-reads, so each is asserted here rather than described in a document:
 *
 * - no workflow resolves the private store, so no job can read a held-out case;
 * - no workflow runs on `pull_request_target`, the trigger that executes a fork's
 *   branch against the base repository's token and secret store;
 * - no workflow reads a stored secret, so there is nothing for contributed code
 *   to exfiltrate even if it ran.
 *
 * Failing here is not a style complaint. Each rule names the path a leak would
 * take, and a workflow that legitimately needs one of them belongs in its own
 * file with its own review, not in the gate that runs on every contribution.
 */
export async function validateWorkflowIsolation(
  options: ValidateWorkflowIsolationOptions
): Promise<void> {
  const { errors, notes, privateStoreEnvVars, projectRoot } = options;
  const workflowsDirectory = options.workflowsDirectory ?? defaultWorkflowsDirectory;
  const absolute = path.join(projectRoot, workflowsDirectory);

  let entries;

  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    notes.push(`${workflowsDirectory}/: no workflows found.`);
    return;
  }

  const files = entries
    .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  for (const file of files) {
    const relativePath = path.posix.join(workflowsDirectory, file);
    const source = await readFile(path.join(absolute, file), 'utf8');

    checkWorkflow({ errors, privateStoreEnvVars, relativePath, source });
  }

  notes.push(
    `${workflowsDirectory}/: ${files.length} workflow(s) checked for acceptance-set isolation.`
  );
}

function checkWorkflow(options: {
  errors: string[];
  privateStoreEnvVars: Set<string>;
  relativePath: string;
  source: string;
}): void {
  const { errors, privateStoreEnvVars, relativePath, source } = options;
  // Comments are stripped first: a workflow that explains in prose why it does
  // not touch the private store must not fail for saying so.
  const body = source.replace(commentPattern, '$1');

  for (const variable of privateStoreEnvVars) {
    if (body.includes(variable)) {
      errors.push(
        `${relativePath}: names ${variable}; the held-out set must stay unreachable from CI.`
      );
    }
  }

  // Any mention at all, in either `on:` form. There is no benign use of the
  // trigger in a workflow that also runs on ordinary pull requests.
  if (/\bpull_request_target\b/.test(body)) {
    errors.push(
      `${relativePath}: triggers on pull_request_target, which runs a fork's code against this repository's secrets.`
    );
  }

  const named = new Set(
    [...body.matchAll(secretReferencePattern)].map((match) => match[1] as string)
  );

  named.delete(permittedSecret);

  if (named.size > 0) {
    errors.push(
      `${relativePath}: reads stored secret(s) ${[...named].sort().join(', ')}; a workflow that runs contributed code must have nothing to leak.`
    );
  }
}
