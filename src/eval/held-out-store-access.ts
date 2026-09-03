import { realpath } from 'node:fs/promises';

import { heldOutCaseFile } from './eval-run-orchestration.ts';
import { isInside } from './path-containment.ts';

/**
 * The one place a held-out case body may be read from.
 *
 * `heldOutCaseFile` joins strings, which is all a path built from a manifest
 * can promise. A traversing case id, or a lane source that is a symlink out of
 * the store, still lands on a real file somewhere the store does not own, and a
 * containment check on the path as written agrees that it is fine. So the check
 * is made here instead, against paths the filesystem has resolved, immediately
 * before the read that would act on them.
 */
export async function resolveHeldOutCaseFile(options: {
  id: string;
  laneSource: string | null;
  privatePath: string;
}): Promise<{ error: string; file?: undefined } | { error?: undefined; file: string }> {
  const written = heldOutCaseFile(options);
  let store: string;

  try {
    store = await realpath(options.privatePath);
  } catch {
    return { error: `the held-out store at ${options.privatePath} could not be resolved` };
  }

  let target: string;

  try {
    target = await realpath(written);
  } catch {
    return { error: `it is missing from the store at ${written}` };
  }

  if (!isInside(target, store)) {
    return { error: `it resolves to ${target}, outside the held-out store at ${store}` };
  }

  return { file: target };
}
