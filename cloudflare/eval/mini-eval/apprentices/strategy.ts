/**
 * Strategy apprentice — the definition of the programmatic apprentice that
 * loads the strategy binder.
 *
 * Consumed by the mini-eval harness today; the SAME object will (later, in the
 * Phase-1 Step-2b orchestrator rewrite) be consumed by the orchestrator when
 * apprentices are wired into the 9-step loop. So keep this file free of
 * harness-specific AND orchestrator-specific concerns — it is just the
 * apprentice's identity, its binder, its deliverable, and its pass rule.
 *
 * Mini-eval note: the harness INLINES the binder files into the system prompt
 * (it does not rely on the Skill tool). That is deliberate — the mini-eval
 * tests the binder's *content/judgment*, not whether the model reliably
 * triggers the Skill tool. Skill-trigger reliability is an orchestration
 * concern, evaluated later at full-loop integration (Phase 1 Step 3).
 */

export interface Apprentice {
  /** Stable id. Also the fixtures/<name>/ and rubrics/<name>.md key. */
  name: string;

  /** One-line role summary — mirrors the binder's SKILL.md frontmatter. */
  description: string;

  /**
   * Thin operational identity prompt. Establishes role + I/O contract +
   * deliverable ONLY. The deep persona ("Head of Performance Marketing",
   * "a doctor, not a blender") lives in the binder — so this must defer to
   * the binder and never restate or contradict it.
   */
  identityPrompt: string;

  /**
   * The binder files, repo-root-relative, in read order. The harness strips
   * YAML frontmatter and inlines them into the system prompt after the
   * identityPrompt.
   */
  binderPaths: string[];

  /** Filename the apprentice must Write into its working directory. */
  deliverable: string;

  /** Model alias for the apprentice's own query() run. */
  model: string;

  /** Tools the apprentice is allowed. Keep minimal — no web access. */
  tools: string[];

  /**
   * Overall pass rule, applied by the harness over the judge's per-criterion
   * verdicts (deterministic — not left to judge whim). Criterion ids must
   * match the ids in rubrics/<name>.md.
   */
  passRule: {
    /** Any critical criterion failing => overall fail. */
    critical: string[];
    /** Overall fails if more than this many non-critical criteria fail. */
    maxSupportingFails: number;
  };
}

export const strategyApprentice: Apprentice = {
  name: 'strategy',
  description:
    'Head of Performance Marketing — diagnoses the real conversion blocker, ' +
    'prescribes competing test angles, sizes the test to budget, assigns ' +
    'visual lanes, and writes The Bet.',

  identityPrompt: [
    'You are a senior performance-marketing strategist, engaged for one brand.',
    '',
    'Your complete method follows below, under "# The Strategy Binder". Read it',
    'as your operating manual — it is how you think, not a checklist. It',
    'establishes who you are and what your deliverable, "The Bet", must contain.',
    'Follow it.',
    '',
    'For this engagement you work entirely from files already placed in your',
    'working directory. Read all three before you reason:',
    '  - research.md       the brand, its buyers, market, reputation, visual reality',
    '  - competitors.md    rivals and where their ads cluster',
    '  - founder-facts.md  the founder\'s own facts (may be thin or partly missing)',
    '',
    'You have NO web access and no other tools beyond Read and Write. Reason only',
    'from those three files plus the current date you are given.',
    '',
    'Your deliverable is a single file — thebet.md — written into your working',
    'directory, in the five-part form the binder specifies. Produce nothing else.',
    'When thebet.md is written, you are done.',
  ].join('\n'),

  binderPaths: [
    'agent/.claude/skills/strategy/SKILL.md',
  ],

  deliverable: 'thebet.md',
  model: 'claude-sonnet-4-6',
  tools: ['Read', 'Write'],

  passRule: {
    // The load-bearing four — the binder's own "tell your work from slop" core.
    critical: ['diagnosis', 'triangulation', 'honesty-fork', 'no-fabrication'],
    maxSupportingFails: 1,
  },
};
