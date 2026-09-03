import { describe, expect, it } from 'vitest';

import type { GateResult } from '../../src/eval/gate-result.ts';
import {
  runPresentationalStaticGates,
  type CandidateFile,
} from '../../src/eval/presentational-output-static-gates.ts';

const cleanComponent = [
  "import { clsx } from 'clsx';",
  '',
  'export function StatusBadge({ label, tone, onDismiss }) {',
  '  const [hovered, setHovered] = useState(false);',
  '',
  '  return (',
  '    <span',
  '      className={clsx(styles.badge, styles[tone], hovered && styles.hovered)}',
  '      onMouseEnter={() => setHovered(true)}',
  '    >',
  '      {label}',
  '      <button type="button" onClick={onDismiss}>Dismiss</button>',
  '    </span>',
  '  );',
  '}',
].join('\n');

describe('runPresentationalStaticGates', () => {
  it('passes a component that holds only presentation-local state', () => {
    const results = run([{ path: 'StatusBadge.tsx', source: cleanComponent }], ['clsx']);

    expect(Object.fromEntries(results.map((result) => [result.invariant, result.status]))).toEqual({
      'INV-DEP-001': 'pass',
      'INV-SCOPE-001': 'pass',
      'INV-SOURCE-001': 'pass',
      'INV-TOKEN-001': 'pass',
    });
  });

  it('reports nothing as unverified rather than passing when no output exists', () => {
    const results = runPresentationalStaticGates({ files: [] });

    expect(results.map((result) => result.invariant).sort()).toEqual([
      'INV-DEP-001',
      'INV-SCOPE-001',
      'INV-SOURCE-001',
      'INV-TOKEN-001',
    ]);
    expect(results.every((result) => result.status === 'unverified')).toBe(true);
  });

  it.each([
    ['fetch call', "const data = await fetch('/api/plans');", 'data'],
    ['router import', "import { useNavigate } from 'react-router-dom';", 'routing'],
    ['store hook', 'const value = useSelector((s) => s.plans);', 'state-store'],
    ['persistence', "localStorage.setItem('plan', id);", 'persistence'],
    ['analytics', "analytics.track('plan_viewed');", 'analytics'],
    ['credentials', 'const key = process.env.API_KEY;', 'secrets'],
    ['flutter http', "import 'package:http/http.dart' as http;", 'data'],
    ['swift lifecycle', '@EnvironmentObject var session: Session', 'state-store'],
  ])('fails INV-SCOPE-001 on a %s', (_label, line, capability) => {
    const scope = find(run([{ path: 'Widget.tsx', source: line }]), 'INV-SCOPE-001');

    expect(scope.status).toBe('fail');
    expect(scope.evidence.join(' ')).toContain(capability);
  });

  it('does not fail a forbidden capability that appears only in a comment', () => {
    const source = [
      '// Never call fetch( here; the build role owns data.',
      '/*',
      ' * useNavigate() belongs to squad-frontend, not to this component.',
      ' */',
      'export const Panel = () => <section />;',
    ].join('\n');

    expect(find(run([{ path: 'Panel.tsx', source }]), 'INV-SCOPE-001').status).toBe('pass');
  });

  it('reports the file and line of every forbidden capability', () => {
    const source = ['export const A = () => {', "  fetch('/x');", '};'].join('\n');

    expect(find(run([{ path: 'src/A.tsx', source }]), 'INV-SCOPE-001').evidence[0]).toContain(
      'src/A.tsx:2'
    );
  });

  it('fails INV-DEP-001 on an import outside the approved set', () => {
    const source = "import { motion } from 'framer-motion';";
    const dependency = find(run([{ path: 'A.tsx', source }], ['clsx']), 'INV-DEP-001');

    expect(dependency.status).toBe('fail');
    expect(dependency.evidence[0]).toContain('framer-motion');
  });

  it('reports an unreadable approved set as unverified, not as a failing import', () => {
    const source = "import React from 'react';";
    const dependency = find(run([{ path: 'A.tsx', source }], null), 'INV-DEP-001');

    expect(dependency.status).toBe('unverified');
    expect(dependency.evidence).toEqual([]);
  });

  it('refuses an in-source marker as approval, because the run writes that file', () => {
    const source = [
      '// eval-approved-dependency: motion primitives accepted in the evidence packet',
      "import { motion } from 'framer-motion';",
    ].join('\n');

    expect(find(run([{ path: 'A.tsx', source }], []), 'INV-DEP-001').status).toBe('fail');
  });

  it('treats relative and scoped specifiers correctly', () => {
    const source = [
      "import { Card } from './Card';",
      "import { Root } from '@radix-ui/react-dialog';",
    ].join('\n');
    const dependency = find(run([{ path: 'A.tsx', source }], []), 'INV-DEP-001');

    expect(dependency.evidence).toHaveLength(1);
    expect(dependency.evidence[0]).toContain('@radix-ui/react-dialog');
  });

  it('fails INV-SOURCE-001 when a source page is bundled into the output', () => {
    const source = `${'word '.repeat(400)}\nhttps://www.w3.org/TR/WCAG22/`;
    const bundled = find(run([{ path: 'docs/wcag.md', source }]), 'INV-SOURCE-001');

    expect(bundled.status).toBe('fail');
    expect(bundled.evidence[0]).toContain('https://www.w3.org/TR/WCAG22/');
  });

  it('does not treat a short note that cites a source as a bundled page', () => {
    const source = 'Contrast follows https://www.w3.org/TR/WCAG22/ as registered.';

    expect(find(run([{ path: 'NOTES.md', source }]), 'INV-SOURCE-001').status).toBe('pass');
  });

  it('fails INV-TOKEN-001 on raw literals outside a token file', () => {
    const source = '.badge { color: #ff0044; font-size: 13px; }';
    const tokens = find(run([{ path: 'Badge.module.css', source }]), 'INV-TOKEN-001');

    expect(tokens.status).toBe('fail');
    expect(tokens.severity).toBe('medium');
    expect(tokens.evidence.join(' ')).toContain('#ff0044');
  });

  it('quotes the whole measurement so the evidence line is checkable', () => {
    const source = '.badge { font-size: 13.5px; }';
    const tokens = find(run([{ path: 'Badge.module.css', source }]), 'INV-TOKEN-001');

    expect(tokens.evidence.join(' ')).toContain('font-size: 13.5px');
  });

  it('reports a React style object literal by its value', () => {
    const source = 'const style = { fontSize: 13 };';
    const tokens = find(run([{ path: 'Badge.tsx', source }]), 'INV-TOKEN-001');

    expect(tokens.evidence.join(' ')).toContain('fontSize: 13');
  });

  it('allows the same literals inside a declared token file', () => {
    const source = ':root { --accent: #ff0044; }';

    expect(find(run([{ path: 'styles/tokens.css', source }]), 'INV-TOKEN-001').status).toBe('pass');
  });
});

function run(files: CandidateFile[], approvedDependencies: string[] | null = []): GateResult[] {
  return runPresentationalStaticGates({ approvedDependencies, files });
}

function find(results: GateResult[], invariant: string): GateResult {
  const result = results.find((entry) => entry.invariant === invariant);

  if (!result) throw new Error(`No result for ${invariant}.`);

  return result;
}

describe('inputs that must not blind or trip the static gates', () => {
  it('keeps scanning after a string that contains a block-comment opener', () => {
    const source = [
      "const files = '**/*.module.css';",
      "fetch('/api/preferences');",
      'const key = process.env.API_KEY;',
    ].join('\n');
    const results = run([{ path: 'Panel.tsx', source }]);

    expect(find(results, 'INV-SCOPE-001').status).toBe('fail');
    expect(find(results, 'INV-SCOPE-001').evidence.join(' ')).toContain('Panel.tsx:2');
  });

  it('keeps scanning after a string that contains a line-comment marker', () => {
    const source = 'const help = "use // to comment"; fetch(\'/api/x\');';

    expect(find(run([{ path: 'Panel.tsx', source }]), 'INV-SCOPE-001').status).toBe('fail');
  });

  it('still strips a real block comment across lines', () => {
    const source = ['/*', ' * never call fetch( here', ' */', 'export const A = () => null;'].join(
      '\n'
    );

    expect(find(run([{ path: 'A.tsx', source }]), 'INV-SCOPE-001').status).toBe('pass');
  });

  it('reads a CSS id selector and its hex literal rather than dropping the line', () => {
    const tokens = find(
      run([{ path: 'a.css', source: '#top { color: #ff0044; }' }]),
      'INV-TOKEN-001'
    );

    expect(tokens.status).toBe('fail');
    expect(tokens.evidence.join(' ')).toContain('#ff0044');
  });

  it('does not read an HTML numeric entity as a color literal', () => {
    const source = 'export const T = () => <p>Pro &#8212; Team &#160; plan</p>;';

    expect(find(run([{ path: 'T.tsx', source }]), 'INV-TOKEN-001').status).toBe('pass');
  });

  it('does not read an in-page anchor as a color literal', () => {
    const source = 'export const L = () => <a href="#fade">Details</a>;';

    expect(find(run([{ path: 'L.tsx', source }]), 'INV-TOKEN-001').status).toBe('pass');
  });

  it('passes a motion parameter named amplitude', () => {
    const source = [
      'const amplitude = 12;',
      'export const W = ({ phase }) => wave(amplitude, phase);',
    ].join('\n');

    expect(find(run([{ path: 'W.tsx', source }]), 'INV-SCOPE-001').status).toBe('pass');
  });

  it('still fails a real analytics client call', () => {
    const source = "amplitude.logEvent('viewed');";

    expect(find(run([{ path: 'W.tsx', source }]), 'INV-SCOPE-001').status).toBe('fail');
  });

  it('fails a store binding imported as react-redux', () => {
    const source = [
      "import { connect } from 'react-redux';",
      'const mapStateToProps = (state) => ({ tone: state.plan.tone });',
      'export default connect(mapStateToProps)(Badge);',
    ].join('\n');

    expect(find(run([{ path: 'Badge.tsx', source }]), 'INV-SCOPE-001').status).toBe('fail');
  });

  it('fails a query client threaded through props', () => {
    const source = "import { QueryClientProvider } from '@tanstack/react-query';";

    expect(find(run([{ path: 'Root.tsx', source }]), 'INV-SCOPE-001').status).toBe('fail');
  });
});
