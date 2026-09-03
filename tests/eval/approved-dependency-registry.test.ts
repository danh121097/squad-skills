import { describe, expect, it } from 'vitest';

import {
  approvedDependenciesFor,
  validateApprovedDependencies,
} from '../../src/eval/approved-dependency-registry.ts';

/**
 * The approved set is the one thing in `INV-DEP-001` a run must not be able to
 * write, so these fix where it comes from rather than what it contains.
 */
const platforms = new Set(['web', 'flutter', 'swiftui']);

const manifest = {
  approved_dependencies: {
    flutter: ['package:flutter'],
    swiftui: [],
    web: ['react', 'react-dom'],
  },
};

describe('approvedDependenciesFor', () => {
  it('returns the declared set for a platform', () => {
    expect(approvedDependenciesFor(manifest, 'web')).toEqual(['react', 'react-dom']);
    expect(approvedDependenciesFor(manifest, 'swiftui')).toEqual([]);
  });

  it('separates an undeclared platform from one declared empty', () => {
    // An empty set approves nothing; a missing one is unknown, and the gate
    // reports that as unverified instead of failing every framework import.
    expect(approvedDependenciesFor(manifest, 'compose')).toBeNull();
    expect(approvedDependenciesFor({}, 'web')).toBeNull();
  });
});

describe('validateApprovedDependencies', () => {
  const check = (value: unknown, targeted: string[] = ['web']): string[] => {
    const errors: string[] = [];

    validateApprovedDependencies({
      errors,
      manifest: value === undefined ? {} : { approved_dependencies: value },
      manifestPath: 'case-manifest.yml',
      platforms,
      targeted: new Set(targeted),
    });

    return errors;
  };

  it('accepts a registry covering every targeted platform', () => {
    expect(check(manifest.approved_dependencies, ['web', 'flutter'])).toEqual([]);
  });

  it('refuses a missing registry', () => {
    expect(check(undefined).join()).toContain('approved_dependencies is missing');
  });

  it('refuses an unknown platform and a non-list entry', () => {
    const errors = check({ web: 'react', windows: [] });

    expect(errors.some((error) => error.includes('unknown platform "windows"'))).toBe(true);
    expect(errors.some((error) => error.includes('must be a list of package names'))).toBe(true);
  });

  it('refuses a platform a case targets but the registry omits', () => {
    expect(check({ web: [] }, ['web', 'flutter']).join()).toContain(
      'a case targets "flutter" but approved_dependencies declares no set for it'
    );
  });
});
