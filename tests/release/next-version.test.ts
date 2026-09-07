import { describe, expect, it } from 'vitest';

import { compareVersions, nextVersion, parseVersion } from '../../src/release/next-version.ts';

describe('parseVersion', () => {
  it('reads the three components', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
  });

  it('rejects anything that is not major.minor.patch', () => {
    for (const value of ['1.2', '1.2.3.4', 'v1.2.3', '1.2.x', '']) {
      expect(() => parseVersion(value)).toThrow(/not a major\.minor\.patch version/);
    }
  });
});

describe('compareVersions', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    expect(compareVersions('1.2.0', '1.1.9')).toBeGreaterThan(0);
    expect(compareVersions('0.1.1', '0.1.0')).toBeGreaterThan(0);
    expect(compareVersions('0.1.0', '0.1.0')).toBe(0);
  });

  it('compares numerically, not as strings', () => {
    // '0.10.0' < '0.9.0' under a string sort, which would let a release script
    // wave through a version npm then rejects at the end of the full gate.
    expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0);
  });
});

describe('nextVersion', () => {
  it('bumps each component and resets the ones below it', () => {
    expect(nextVersion('1.2.3', 'patch')).toBe('1.2.4');
    expect(nextVersion('1.2.3', 'minor')).toBe('1.3.0');
    expect(nextVersion('1.2.3', 'major')).toBe('2.0.0');
  });

  it('accepts an explicit version that skips ahead', () => {
    expect(nextVersion('0.1.0', '1.0.0')).toBe('1.0.0');
  });

  it('refuses to move backwards or stand still', () => {
    expect(() => nextVersion('0.2.0', '0.1.0')).toThrow(/does not follow/);
    expect(() => nextVersion('0.2.0', '0.2.0')).toThrow(/does not follow/);
  });

  it('refuses a prerelease and says which dist-tag problem it is', () => {
    expect(() => nextVersion('0.1.0', '1.0.0-beta.1')).toThrow(/dist-tag/);
  });

  it('names the valid arguments when the request is a typo', () => {
    expect(() => nextVersion('0.1.0', 'pathc')).toThrow(/major, minor, patch/);
  });
});
