import { describe, expect, it } from 'vitest';

import { nextVersion, parseVersion } from '../../src/release/next-version.ts';

describe('parseVersion', () => {
  it('reads the three components', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
  });

  it('reads them as numbers, so 10 is not compared as a string', () => {
    expect(parseVersion('0.10.0')).toEqual([0, 10, 0]);
  });

  it('rejects anything that is not major.minor.patch', () => {
    for (const value of ['1.2', '1.2.3.4', 'v1.2.3', '1.2.x', '1.0.0-beta.1', '']) {
      expect(() => parseVersion(value)).toThrow(/not a major\.minor\.patch version/);
    }
  });
});

describe('nextVersion', () => {
  it('bumps each component and resets the ones below it', () => {
    expect(nextVersion('1.2.3', 'patch')).toBe('1.2.4');
    expect(nextVersion('1.2.3', 'minor')).toBe('1.3.0');
    expect(nextVersion('1.2.3', 'major')).toBe('2.0.0');
  });

  it('carries double digits rather than concatenating them', () => {
    expect(nextVersion('0.9.9', 'patch')).toBe('0.9.10');
    expect(nextVersion('0.9.9', 'minor')).toBe('0.10.0');
  });
});
