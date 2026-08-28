import type { BoundaryClause, RetiredPhrase } from './cross-skill-contract-validator.ts';

const designerSkill = 'skills/squad-designer/SKILL.md';
const designerMotion = 'skills/squad-designer/references/platform-web-foundations-and-motion.md';
const designerHandoff =
  'skills/squad-designer/references/design-system-ux-accessibility-and-handoff.md';
const designerExamples = 'skills/squad-designer/references/codebase-first-examples.md';
const designerQuality = 'skills/squad-designer/references/anti-slop-quality-review.md';
const designerResearch = 'skills/squad-designer/references/task-specific-ui-ux-research.md';
const designerSources = 'skills/squad-designer/references/official-sources.md';
const designerNativeCross = 'skills/squad-designer/references/platform-native-cross-platform.md';
const designerNativeAppleAndroid =
  'skills/squad-designer/references/platform-native-apple-android.md';
const designerAdaptive = 'skills/squad-designer/references/platform-adaptive-layout-and-input.md';
const frontendIntake = 'skills/squad-frontend/references/designer-gate-and-design-intake.md';
const frontendMotion = 'skills/squad-frontend/references/frontend-stack-and-motion-selection.md';
const mobileGates = 'skills/squad-mobile/references/design-platform-and-lifecycle-gates.md';
const teamPipeline = 'skills/squads-team/references/delivery-pipeline-and-roster.md';
const teamCoordination = 'skills/squads-team/references/coordination-contract.md';
// Each role states the AgentKit pairing contract in the reference its own
// router points at for tool selection, so the file names differ by role.
const backendRuntime = 'skills/squad-backend/references/runtime-capability-fallbacks.md';
const codeReviewRuntime = 'skills/squad-code-review/references/review-runtime-and-verdict.md';
const devopsRuntime = 'skills/squad-devops/references/runtime-and-safe-delivery-fallbacks.md';
const fixRuntime = 'skills/squad-fix/references/runtime-capability-fallbacks.md';
const frontendRuntime = 'skills/squad-frontend/references/runtime-capability-fallbacks.md';
const mobileRuntime = 'skills/squad-mobile/references/runtime-capability-fallbacks.md';
const qaRuntime = 'skills/squad-qa/references/test-strategy-runtime-and-verdict.md';
const roleRuntimes = [
  backendRuntime,
  codeReviewRuntime,
  devopsRuntime,
  fixRuntime,
  frontendRuntime,
  mobileRuntime,
  qaRuntime,
];
// Handed to the lead when a named squad-* skill is absent, so it states the
// boundary for exactly the case where `squad-designer` never runs.
const teamContracts = 'skills/squads-team/references/domain-coverage-contracts.md';

/**
 * The role boundary as it stands after the designer moved from spec-only to
 * presentational code. Every skill that names the boundary carries the same
 * sentence so a reader of any one of them learns the same contract.
 */
export const boundaryClauses: BoundaryClause[] = [
  {
    id: 'BOUNDARY-ARTIFACT-001',
    statement: 'the designer hands over presentational component code, not a written spec',
    files: [designerSkill, frontendIntake, mobileGates, teamContracts, teamPipeline],
  },
  {
    id: 'BOUNDARY-LOGIC-001',
    statement:
      'state, data fetching, API integration, routing, forms submission, and platform lifecycle stay with the build role',
    files: [designerSkill, frontendIntake, mobileGates, teamContracts, teamPipeline],
  },
  {
    id: 'BOUNDARY-MOTION-001',
    statement:
      'whoever writes the animation code owns its lifecycle scoping, teardown, and reduced-motion fallback',
    // The adaptive reference is not bound: it carries no animation guidance of
    // its own and always composes with a platform reference that does.
    files: [
      designerMotion,
      designerNativeCross,
      designerNativeAppleAndroid,
      frontendMotion,
      mobileGates,
    ],
  },
  {
    id: 'PAIRING-DETECT-001',
    // The team contract detects once per run rather than per task, so the
    // clause binds the mechanism both share, not the cadence they do not.
    statement: 'by inspecting the live skill catalog for',
    files: [...roleRuntimes, designerSources, teamCoordination],
  },
  {
    id: 'PAIRING-AUTHORITY-001',
    // Deliberately starts after the subject: roles say "this role's boundary,
    // gates, and evidence rules", the designer says "this skill's boundary,
    // source lanes, and quality bar". What must not drift is which side wins.
    statement: 'stay authoritative wherever the two disagree',
    files: [...roleRuntimes, designerSources],
  },
  {
    id: 'PAIRING-SAFETY-001',
    // The designer is not bound: its entrypoint carries the never-auto-install
    // rule in "Scope and boundary", and its registry states the same ban in the
    // registry's own words rather than repeating this sentence.
    statement: 'never report a skill as run when it does not exist',
    files: roleRuntimes,
  },
];

/**
 * Spec-era wording that contradicts the clauses above. Retired phrases sweep
 * the whole designer surface, not only the files a clause binds: a reference
 * that no clause names can still tell the designer to hand over a document, and
 * that contradiction ships even though every bound file agrees.
 */
export const retiredPhrases: RetiredPhrase[] = [
  {
    id: 'RETIRED-SPEC-001',
    phrase: 'not production code',
    files: [
      designerSkill,
      designerAdaptive,
      designerExamples,
      designerHandoff,
      designerMotion,
      designerNativeAppleAndroid,
      designerNativeCross,
      designerQuality,
      designerResearch,
      designerSources,
      teamContracts,
      teamPipeline,
    ],
  },
  {
    id: 'RETIRED-SPEC-005',
    phrase: 'never production code',
    files: [
      designerSkill,
      designerAdaptive,
      designerExamples,
      designerHandoff,
      designerMotion,
      designerNativeAppleAndroid,
      designerNativeCross,
      designerQuality,
      designerResearch,
      designerSources,
      teamContracts,
      teamPipeline,
    ],
  },
  {
    id: 'RETIRED-SPEC-002',
    phrase: 'implementation-ready design specs',
    files: [designerSkill, designerHandoff, teamPipeline],
  },
  {
    // Deliberately excludes SKILL.md: the entrypoint carries this wording
    // legitimately inside BOUNDARY-ARTIFACT-001 ("not a written spec").
    id: 'RETIRED-SPEC-003',
    phrase: 'written spec',
    files: [
      designerAdaptive,
      designerExamples,
      designerHandoff,
      designerMotion,
      designerNativeAppleAndroid,
      designerNativeCross,
      designerQuality,
      designerResearch,
      designerSources,
    ],
  },
  {
    id: 'RETIRED-SPEC-004',
    phrase: 'markdown handoff',
    files: [
      designerSkill,
      designerAdaptive,
      designerExamples,
      designerHandoff,
      designerMotion,
      designerNativeAppleAndroid,
      designerNativeCross,
      designerQuality,
      designerResearch,
      designerSources,
    ],
  },
];
