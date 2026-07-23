/**
 * pipeline.ts — the lite orchestrator: §8 prompt (verbatim from the plan doc),
 * buildLiteOptions (the single source of truth for the SDK Options), and the
 * lite-specific code guards:
 *
 *   · buildHooks (imported from agent-loop, config-driven): orchestrator-MCP
 *     block, founder-URL write-belt, spec assembly (creatives/c*.json →
 *     creatives.json), doneRequires, post-DONE ceiling relaxation, launch caps.
 *   · picks assembly (lite): field/picks/p<N>.json → field/picks.jsonl on every
 *     landing — the field seat writes incrementally, compaction never loses
 *     completed reads (S155 quality guard).
 *   · verdict schema enforcement (lite): a Write to verdict.json that does not
 *     parse into the rubric's exact shape is DENIED with the precise reason —
 *     deterministic schema enforcement on a judging subagent (S155 amendment 2).
 *
 * Circuit breaker (§6) lives in the orchestrator prompt (branch on batchOutcome)
 * + the launch ceilings: create=3 (initial + one redo + headroom), judge default 2.
 */
import type { Options, AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { perplexityMcpServer, PERPLEXITY_TOOL_NAME } from '../agent-loop/mcp/perplexity.ts';
import { createRenderServer, RENDER_TOOL } from '../agent-loop/mcp/render.ts';
import { buildHooks } from '../agent-loop/hook.ts';
import { createHarvestServer, HARVEST_TOOL, HUNT_TOOL } from './mcp/harvest.ts';
import { createCaptureProductsServer, CAPTURE_PRODUCTS_TOOL } from './mcp/capture-products.ts';
import { INJECTED_FILE, LEARNED_RECORD_FILE } from './memory-store.ts';
import { LITE_STAGES, LITE_ORDER, type LiteStage } from './stages.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFERENCES = join(__dirname, 'references');

const ALL_MCP_TOOLS = [PERPLEXITY_TOOL_NAME, HARVEST_TOOL, HUNT_TOOL, RENDER_TOOL, CAPTURE_PRODUCTS_TOOL];

// ── Brand-memory injection (memory plan §7) ──────────────────────────────────
// The orchestrator gets ONLY the founder-stated rules (memory plan §12.1 — its
// prompt is re-ingested on every wake, so the block stays minimal), and only to
// SURFACE intake contradictions. Empty/absent store → '' → the prompt is
// byte-identical to a memory-less run.
function memoryConflictBlock(runDir: string): string {
  try {
    const inj = JSON.parse(fs.readFileSync(join(runDir, INJECTED_FILE), 'utf8'));
    const laws = (Array.isArray(inj?.rules) ? inj.rules : []).filter((r: any) => r?.status === 'founder-stated');
    if (!laws.length) return '';
    return `
MEMORY CONFLICTS — previous runs recorded these FOUNDER-STATED rules for this brand:
${laws.map((r: any) => `  - ${r.scope === 'user' ? 'user-' : ''}R${r.id}: ${r.text}`).join('\n')}
If an intake answer CONTRADICTS one of these, ask ONE extra AskUserQuestion — "policy change,
or one-time exception?" — and record the answer VERBATIM in founder-facts.md under
"## Memory conflicts". Today's answer always wins for this run either way; never resolve a
contradiction silently, and never enforce an old rule against today's word.
`;
  } catch { return ''; }
}

// ── The orchestrator prompt — plan §8, verbatim ──────────────────────────────
export function liteOrchestratorPrompt(brandUrl: string, runDir: string): string {
  return `You orchestrate an ad-creative pipeline. You do NOT do the creative work yourself and you
do NOT call MCP tools — with ONE exception: capture_products during founder intake (step 3
below). You delegate to specialist seats via the Agent tool; stages hand off through files
in the working directory.

Working directory: ${runDir}. The brand URL is ${brandUrl}. Before you woke, code already
captured: raw/pages/*.txt (verbatim page text), brand.md + assets/ (logo, palette, voice,
pack shots), and any redirect warning. These are ground truth — never re-fetch, never
substitute prior knowledge of the brand.

CONCURRENCY: exactly ONE agent in flight, always. When you launch an agent you get
"Async agent launched…" — WAIT for its completion notification, then confirm its
deliverable file exists (Read or Glob) BEFORE the next step. Never give up waiting,
never poll-then-quit.

STALL RECOVERY: if a seat's completion notification arrives but its deliverable is
MISSING or incomplete, do not immediately relaunch. Send that SAME agent a SendMessage
naming exactly what remains ("you stopped after X; now do Y and write <file>") — its
context is intact, so the nudge is far cheaper than a fresh launch. ONE nudge; if the
deliverable is still missing after it, relaunch the seat once.

FOUNDER INTAKE (you are in a live chat with the founder):
  0. Read brand.md ONLY (and raw/redirect.txt if it exists) — do NOT read the raw page texts;
     research owns them, and everything you ingest is re-read on your every wake for the whole
     session. If redirect.txt exists, the entered domain redirects elsewhere — CONFIRM the
     landing brand with the founder before anything else.
  1. ASK ROUND ONE (AskUserQuestion, up to 4): the conversion event and its price; the
     buyer + market; any offer running now (verbatim if yes); target CPA or budget.
  2. ASK ROUND TWO (AskUserQuestion, up to 4): BRAND LAWS ("what will this brand NEVER
     do — discounts? urgency? — and what real fuel does it hold?"); the REGISTER
     (mass-loud / premium-clinical / follow-the-field); assets check ("upload the hero
     product photo via the panel now" — with a 'no photo' option); compliance lane if
     the category suggests one (finserv/health).
  3. PRODUCT FETCH (founder-driven): if the founder's answers name catalogue products whose
     photos are NOT in the pack-shot inventory, look them up in brand.md's "## Catalogue"
     list and call capture_products ONCE with their EXACT urls (max 4; never a guessed slug;
     a product not in the list = an honest gap, offer the upload panel). This is your ONLY
     direct tool call in the whole run — it exists so "I want X in the mix" becomes photos
     on disk, not an apology.
  4. Check assets/ (Glob) — then Read (VIEW) one downloaded pack shot PER PRODUCT before
     writing any asset gap: the founder's memory of their assets is not evidence (run 1: "no
     model photo" was recorded while every pack shot on disk showed a model — the false
     premise steered four stages). Write founder-facts.md replacing the stub. The FIRST line
     after the title MUST be \`Brand URL: ${brandUrl}\` — copied VERBATIM, query params
     included. Record founder answers verbatim; founder-given hexes OUTRANK extraction.
     State every gap explicitly, and describe what the pack shots ACTUALLY show.
${memoryConflictBlock(runDir)}
RUN THIS FLOW, in order:
  • research — subagent "research" → research.md (numbered verbatim artifacts + the
      ## Competitor candidates section). Verify it exists, artifacts are numbered, and the
      competitor list is present before proceeding.
  • field — subagent "field" → field/picks.jsonl + field/field-summary.json. It calls
      the harvest tool itself, views the creatives, and runs the format hunt internally
      when its summary orders one. Verify BOTH files exist and picks.jsonl parses.
  • create — subagent "create" → creatives/c1.json … c6.json (the harness assembles
      creatives.json; neither you nor create writes it). Verify the spec files exist —
      6 preferred; 5 with a DECLARED shortfall is legitimate (honest scarcity beats
      invented sourcing; the judge kills inventions anyway). Note any shortfall for
      the founder summary.
  • judge — subagent "judge" (cold: pass it NOTHING of create's reasoning; it reads the
      spec files and evidence itself and VIEWS the pack shots). It writes verdict.json.
      Read it and branch on batch.batchOutcome:
        · NORMAL (4+ ship) → proceed with the ranked shipList.
        · THIN (2-3) → proceed too — honest gaps ship; note it for the summary.
        · FAILED (≤1) → ONE redo: re-run create ("read verdict.json; write a NEW batch
          answering every autopsy line; survivors stand untouched"), then judge once
          more, then proceed with whatever survives. NEVER a second redo — if the fresh
          verdict is still FAILED, ship the survivors and write the flag into DONE.md.
      CAPTION SANITATION: if any SHIPPING spec carries "captionFixes" in verdict.json,
      launch create SCOPED before build ("apply ONLY these captionFixes to the named
      specs' caption/primaryText fields; touch nothing else"), verify the edits landed
      (Read the spec files), THEN build. Judge-directed sanitation, not a redo — it does
      not count against the redo limit.
  • build — subagent "build", instructed with the shipList ids and ratios (default 4:5).
      It views the bound assets, writes the prompts, renders via the render tool, runs its
      own catastrophic-only glance with AT MOST one scoped re-render per creative. It
      writes build-output.md (image paths inside). Verify the images exist on disk.

Your FINAL action once images are on disk (or you flagged): write DONE.md — one line,
"shipped: <paths> — <n>/<total> through judge" or "flagged: <reason>". Only at true
completion. Then summarize for the founder: what shipped, which field evidence each
creative adapts (from picks.jsonl — name the source ad, its advertiser, and its
endorsement numbers), and what was killed and why (verdict autopsies).
Plain language, no jargon.

FOLLOW-UPS — THE ROUTER (the chat continues after DONE.md). Never re-run the whole
pipeline; route to the SMALLEST seat that owns the change, scoped by name:
  · QUESTION ("why this hook?", "what does Snitch run?") → answer YOURSELF from the
    files (Read/Grep picks.jsonl, verdict.json, research.md). Launch NOTHING.
  · COPY/SPEC change on an existing creative → create, scoped ("edit ONLY c3's
    <field>; touch nothing else") → build scoped to c3. Founder-directed, so the
    JUDGE IS SKIPPED.
  · RENDER problem, spec unchanged ("logo garbled") → build scoped re-render. No create.
  · NEW concept ("try something around X") → create (ADD c7; survivors untouched) →
    judge the new spec cold → build. New bets always face the judge.
  · UPSTREAM truth changed (new offer, different audience) → confirm with
    AskUserQuestion first (name what re-runs and why), then create ⇄ judge → build.
    Re-run field ONLY if the founder names a different market or competitor set.
  If the ask is VAGUE ("make it pop"), AskUserQuestion to pin it down BEFORE delegating.`;
}

// ── Agents ───────────────────────────────────────────────────────────────────
function liteAgentDef(stage: LiteStage, learnedBlock = ''): AgentDefinition {
  const ref = stage.reference ? fs.readFileSync(join(REFERENCES, stage.reference), 'utf8') : null;
  const prompt = ref
    ? `${stage.identityPrompt}\n\n════════════════ YOUR LAW (references/${stage.reference}) ════════════════\n\n${ref}${
        stage.name === 'field' ? `\n\n════════════════ THE PICK SCHEMA (references/read-schema-lite.md) ════════════════\n\n${fs.readFileSync(join(REFERENCES, 'read-schema-lite.md'), 'utf8')}` : ''
      }`
    : stage.identityPrompt;
  // S155 F18 (the halted research seat): an async agent that ends a turn with plain
  // text is COMPLETE. Every seat gets the anti-halt law appended.
  const ANTI_HALT =
    '\n\nNEVER end a turn with plain text unless your deliverable is COMPLETE on disk. ' +
    'Narrating a plan and stopping strands the whole pipeline — every turn ends in either ' +
    'a tool call or your finished deliverable.';
  return {
    description: stage.description,
    prompt: prompt + learnedBlock + ANTI_HALT,
    model: stage.model,
    tools: stage.tools,
    mcpServers: stage.mcpServers,
    maxTurns: stage.maxTurns,
  };
}

// Memory plan §7: the learned record reaches RESEARCH and CREATE only. THE
// JUDGE STAYS COLD [F] — independence is its value (S118 same-model-blessing);
// field is evidence-driven; build executes approved specs.
const MEMORY_SEATS = new Set(['research', 'create']);

export function buildLiteAgents(runDir?: string): Record<string, AgentDefinition> {
  // Inlined (≤4KB) rather than left for the seat to Read — no extra turn, no
  // reliance on the model choosing to look. The run-dir audit copy is the single
  // source, so resume re-injects the identical record and a memory-less run
  // (file absent / LITE_MEMORY_OFF) builds byte-identical prompts to today.
  let learned = '';
  if (runDir) {
    try { learned = fs.readFileSync(join(runDir, LEARNED_RECORD_FILE), 'utf8').trim(); } catch { /* no record */ }
  }
  const agents: Record<string, AgentDefinition> = {};
  for (const name of LITE_ORDER) {
    const block = learned && MEMORY_SEATS.has(name)
      ? `\n\n════════════════ LEARNED RECORD (${LEARNED_RECORD_FILE}) ════════════════\n\n${learned}`
      : '';
    agents[name] = liteAgentDef(LITE_STAGES[name], block);
  }
  return agents;
}

// ── Lite code guards ─────────────────────────────────────────────────────────
/** field/picks/p<N>.json → field/picks.jsonl on every landing (numeric order). */
function assemblePicks(runDir: string, onEvent?: (m: string) => void): void {
  const dir = join(runDir, 'field', 'picks');
  let files: string[] = [];
  try { files = fs.readdirSync(dir).filter((f) => /^p\d+\.json$/.test(f)); } catch { return; }
  if (!files.length) return;
  const lines: string[] = [];
  for (const f of files.sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10))) {
    try {
      lines.push(JSON.stringify(JSON.parse(fs.readFileSync(join(dir, f), 'utf8'))));
    } catch (err) {
      onEvent?.(`⚠ field/picks/${f} is not valid JSON — left out of picks.jsonl (${err instanceof Error ? err.message : String(err)})`);
    }
  }
  if (!lines.length) return;
  fs.writeFileSync(join(runDir, 'field', 'picks.jsonl'), lines.join('\n') + '\n');
  onEvent?.(`· assembled field/picks.jsonl (${lines.length} pick${lines.length === 1 ? '' : 's'})`);
}

// ── Deterministic Write-validators (S155 F9) ────────────────────────────────
// Run 1 proved the pattern live: the judge's FIRST verdict.json was malformed,
// the hook denied it with the precise reason, the retry was correct. The same
// run also proved prose schemas get ignored (field-summary v1: zero correct
// keys; specs: persona/validity/compliance missing). So every cross-seat JSON
// artifact now gets a validating hook. All validators are PURE (data injected)
// — the hook layer does the file IO.

const CLOSED_FAMILIES = new Set([
  'product-hero', 'lifestyle-in-use', 'ugc-style', 'testimonial-card', 'us-vs-them',
  'problem-solution', 'text-billboard', 'offer-card', 'editorial-advertorial',
  'meme-native', 'infographic-mechanism',
]);
const CLOSED_CLAIMS = new Set(['offer', 'social-proof', 'mechanism', 'callout', 'curiosity', 'comparison', 'objection-wall', 'letter']);
const okFamily = (v: any) => typeof v === 'string' && (CLOSED_FAMILIES.has(v) || v.startsWith('other:'));
const okClaim = (v: any) => typeof v === 'string' && (CLOSED_CLAIMS.has(v) || v.startsWith('other:'));

// S155 F26: validators report EVERY violation in one denial — run 2's c1 took
// FOUR full model round-trips discovering problems one at a time.
const allProblems = (issues: string[]): string | null =>
  issues.length === 0
    ? null
    : issues.length === 1
      ? issues[0]
      : `${issues.length} problems, fix ALL of them in ONE rewrite: ${issues.map((p, i) => `(${i + 1}) ${p}`).join(' ')}`;

export const RESEARCH_CHAR_CAP = 8000;

/** research.md: the ONE PAGE cap is enforced, not suggested (run 1: 16.5KB → taxed
 *  create + judge context for the whole run).
 *
 *  S155 F31 — the denial must be SURGICAL, not "compress". Run 3's seat trimmed
 *  27,472 → 15,422 → 12,515 and was still over after three full turns (~5 min),
 *  heading for turn starvation with no research.md at all. A vague order buys a
 *  vague trim: state the exact overage, the exact cut, and the exact line format. */
export function researchProblem(content: string): string | null {
  const issues: string[] = [];
  if (content.length > RESEARCH_CHAR_CAP) {
    const over = content.length - RESEARCH_CHAR_CAP;
    const lines = content.split('\n');
    const prose = lines.filter((l) => l.trim().length > 0 && !/^\s*[-*|#]/.test(l) && !/\[[A-Z]?\d+\]/.test(l));
    const proseChars = prose.reduce((n, l) => n + l.length + 1, 0);
    const tableChars = lines.filter((l) => l.trim().startsWith('|')).reduce((n, l) => n + l.length + 1, 0);
    issues.push(
      `research.md is ${content.length} chars — ${over} OVER the ${RESEARCH_CHAR_CAP}-char hard cap. Trimming gradually wastes your turns: make ONE decisive rewrite targeting ~7000 chars. ` +
      `MECHANICAL SURGERY, in this order: (a) DELETE every prose/explanatory line that is not a numbered artifact — ${prose.length} such lines are carrying ${proseChars} chars right now; ` +
      (tableChars > 200 ? `(b) DELETE every markdown table (${tableChars} chars) — tables are the single most expensive format per fact; ` : '(b) no tables to cut; ') +
      `(c) ONE LINE PER ARTIFACT, in exactly this form: \`[A1] "verbatim quote or number" — source-file\`, nothing else — no commentary, no "this matters because", no repeated context; ` +
      `(d) keep EVERY artifact number and the whole ## Competitor candidates list — you are cutting WORDS, never evidence. If it is still over after that, cut the longest quotes to their essential clause, never the artifact count`,
    );
  }
  if (!/##\s*Competitor candidates/i.test(content)) issues.push('missing the "## Competitor candidates" section (6–8 competitors + 2–4 adjacents, with domains when known) — the field harvest cannot run without it');
  const artifacts = new Set(content.match(/\[[A-Z]?\d+\]/g) ?? []);
  if (artifacts.size < 15) issues.push(`only ${artifacts.size} numbered artifacts found — a usable record needs at least 15 (every number on the captured pages becomes one)`);
  return allProblems(issues);
}

/** What ACTUALLY happened at image-download time — from field/manifest.json,
 *  injected by the hook layer (the validator stays pure). */
export interface ImageDownloadRecord { failed: number; failedIds?: string[] }

/** field-summary.json: the six schema keys, presence-checked — plus the
 *  CONFABULATION cross-check (S156, run 5): the seat reported "CDN expiry wiped
 *  pixels on 17 of 27 downloaded images" and downgraded five of its own picks —
 *  when the harvest had recorded exactly ONE failed download, every named file
 *  was on disk, and every Read had returned real pixels. A fabricated failure
 *  story reads as rigour, so it must be checked against the tool's record. */
export function summaryProblem(content: string, imageDownloads?: ImageDownloadRecord | null): string | null {
  let v: any;
  try { v = JSON.parse(content); } catch (e) { return `not valid JSON (${e instanceof Error ? e.message : String(e)})`; }
  const issues: string[] = [];
  const need = ['register', 'formatShare', 'openLane', 'intel', 'doNotClone', 'honesty'];
  const missing = need.filter((k) => !(k in v));
  if (missing.length) issues.push(`missing key(s): ${missing.join(', ')} — the schema in your law has exactly these six`);
  if ('register' in v && (typeof v.register === 'string' ? v.register.length < 40 : !v.register)) issues.push('"register" must be judgment prose with evidence quotes (or an object carrying them)');
  if ('openLane' in v) {
    const lane = v.openLane;
    if (!lane || !['claim-gap', 'format-gap', 'none'].includes(String(lane.type))) issues.push('"openLane.type" must be exactly claim-gap | format-gap | none');
  }
  for (const k of ['intel', 'doNotClone', 'honesty']) if (k in v && !Array.isArray(v[k])) issues.push(`"${k}" must be an array (empty is allowed — missing is not)`);
  if (imageDownloads && Array.isArray(v.honesty)) {
    for (const h of v.honesty) {
      const t = String(h);
      if (!/(cdn|expir|wiped|returned empty|empty on read|unviewable|could not (be )?(view|read))/i.test(t)) continue;
      if (!/(image|pixel|creative)/i.test(t)) continue;
      // first sane number in the claim (archive ids are huge — filter them out);
      // a no-number claim still asserts ≥1 failure.
      const nums = (t.match(/\d+/g) ?? []).map(Number).filter((n) => n > 0 && n < 1000);
      const claimed = nums.length ? nums[0] : 1;
      if (claimed > imageDownloads.failed) {
        issues.push(
          `honesty[] claims ${claimed} unviewable/expired image(s), but the harvest recorded EXACTLY ${imageDownloads.failed} failed download(s)` +
          (imageDownloads.failedIds?.length ? ` (${imageDownloads.failedIds.join(', ')})` : '') +
          ` — every other file is on disk and was served to your Reads in full. Never report a viewing failure that did not happen; if a Read truly errored, quote its exact error text`,
        );
      }
    }
  }
  return allProblems(issues);
}

/** field/picks/p<N>.json: schema + the lane-is-an-evidence-class law (F4: lane
 *  copied VERBATIM) + pick UNIQUENESS (S155 F22: run 2 padded a thin pool by
 *  duplicating p5 into p12 — a short pool ends the sequence, never repeats).
 *  otherPicks maps candidate id → the pick file that already covers it. */
export function pickProblem(content: string, manifestById: Map<string, { lane: string }>, otherPicks: Map<string, string>): string | null {
  let p: any;
  try { p = JSON.parse(content); } catch (e) { return `not valid JSON (${e instanceof Error ? e.message : String(e)})`; }
  const issues: string[] = [];
  if (typeof p.pick !== 'number') issues.push('"pick" must be the pick number');
  if (typeof p.id !== 'string' || !p.id) issues.push('"id" must be the manifest candidate id');
  if (!['workhorse', 'fresh', 'adjacent', 'wildcard', 'hunt'].includes(p.lane)) issues.push(`"lane" ${JSON.stringify(p.lane)} is not a lane`);
  const fq = p.fourQuestions ?? {};
  for (const k of ['construction', 'drCheck', 'lesson', 'cloneRisk']) {
    if (typeof fq[k] !== 'string' || fq[k].length < 30) issues.push(`fourQuestions.${k} is missing or too thin — every pick answers all four questions substantively (no lesson = no slot)`);
  }
  if (!okFamily(p.formatFamily)) issues.push(`formatFamily ${JSON.stringify(p.formatFamily)} is not in the CLOSED table (use "other:<describe>" only when nothing fits)`);
  if (!okClaim(p.claimType)) issues.push(`claimType ${JSON.stringify(p.claimType)} is not in the closed set`);
  if (!p.hook || typeof p.hook.text !== 'string' || !p.hook.text) issues.push('hook.text (verbatim) is required');
  if (typeof p.id === 'string' && p.id) {
    const dup = otherPicks.get(p.id);
    if (dup) issues.push(`candidate "${p.id}" is ALREADY covered by ${dup} — a short pool ENDS the pick sequence, it never licenses a repeat. If the quota cannot be filled, STOP writing picks and record the shortfall in field-summary honesty[]`);
    if (p.id.startsWith('hunt_')) {
      if (p.lane !== 'hunt') issues.push('hunt_* candidates carry lane "hunt"');
      return allProblems(issues);
    }
    const cand = manifestById.get(p.id);
    if (!cand) issues.push(`id "${p.id}" is not in field/manifest.json — picks come from the manifest, never invented`);
    else if (p.lane !== cand.lane) {
      issues.push(`lane "${p.lane}" ≠ manifest lane "${cand.lane}" — lane is an EVIDENCE CLASS and is copied VERBATIM (a 9-day ad must never wear the workhorse survivorship label). To fill a different quota slot with this pick, keep lane="${cand.lane}" and add fillsQuota:"<slot>" + promotionReason (a stated override, per your law)`);
    }
  }
  if (p.fillsQuota !== undefined) {
    if (!['workhorse', 'fresh', 'adjacent', 'wildcard'].includes(p.fillsQuota)) issues.push(`fillsQuota ${JSON.stringify(p.fillsQuota)} is not a quota slot`);
    else if (p.fillsQuota !== p.lane && (typeof p.promotionReason !== 'string' || p.promotionReason.length < 20)) {
      issues.push('a fillsQuota override needs a substantive promotionReason — silent overrides are drift');
    }
  }
  return allProblems(issues);
}

/** How sourcePick "p<N>" aliases resolve, and what the hunt actually found —
 *  injected by the hook layer (validators stay pure). */
export interface PickIndex { ids: Set<string>; aliases: Map<string, string> } // aliases: "p3" → candidate id
export type HuntOutcome = 'no-hunt' | 'found-format' | 'found-nothing';

// S155 F24: an on-image bracketed token renders literally (run 2 shipped
// "[Rate]%" four times as pixels). Placeholders are caption-legal ONLY.
const PLACEHOLDER_RE = /\[[^\[\]]{1,60}\]/;
// S155 F25: lite ships static images — video chrome in a spec is a format lie.
const VIDEO_CHROME_RE = /play button|poster frame|video still/i;

/** creatives/c<N>.json: canonical field names, closed vocab, sourcing ladder. */
export function specProblem(content: string, picks: PickIndex, openLaneType: string | null, huntOutcome: HuntOutcome): string | null {
  let s: any;
  try { s = JSON.parse(content); } catch (e) { return `not valid JSON (${e instanceof Error ? e.message : String(e)})`; }
  const issues: string[] = [];
  if (typeof s.creative !== 'number') issues.push('"creative" (the spec number) is required — the harness assembles by it');
  const sp = s.sourcePick;
  if (typeof sp !== 'string' || !sp) issues.push('"sourcePick" is required (a pick id or its file name "p<N>", "import:<file>", "openlane:<artifact refs>", or "experimental")');
  else if (sp === 'experimental') {
    if (s.experimental !== true) issues.push('sourcePick "experimental" requires "experimental": true');
    // S155 F23: legality is CODE-checked against the hunt record, not prose. An
    // off-format hunt counts as "found nothing"; no hunt at all legalizes nothing.
    if (huntOutcome === 'no-hunt') issues.push('the experimental slot is legal ONLY after a format hunt came back empty — no hunt has run. Source from the ladder (field pick / import:<file> / openlane:<refs>) instead');
    else if (huntOutcome === 'found-format') issues.push('the experimental slot is ILLEGAL here: the format hunt FOUND on-format master creatives (field/manifest-hunt.json, onFormat: true) — adapt a hunt pick instead');
  } else if (sp.startsWith('openlane:')) {
    if (!openLaneType || openLaneType === 'none') issues.push('an openlane: spec is only legal when field-summary.openLane.type is claim-gap or format-gap');
  } else if (!sp.startsWith('import:')) {
    if (/^p\d+$/.test(sp)) {
      // S155 F27: the pick FILE name is how the field summary itself refers to
      // picks — accepted; the harness normalizes it to the candidate id on landing.
      if (!picks.aliases.has(sp)) issues.push(`sourcePick "${sp}" — no field/picks/${sp}.json exists`);
    } else if (!picks.ids.has(sp)) {
      issues.push(`sourcePick "${sp}" is not a pick id in field/picks.jsonl (the pick FILE name, e.g. "p3", is also accepted) — the ladder is: field pick / import:<file> / openlane:<refs> (one) / experimental (one, only after an empty hunt)`);
    }
  }
  if (!okFamily(s.formatFamily)) issues.push(`formatFamily ${JSON.stringify(s.formatFamily)} is not in the CLOSED table (prefix "other:" if truly nothing fits)`);
  if (!okClaim(s.claimType)) issues.push(`claimType ${JSON.stringify(s.claimType)} is not in the closed set`);
  for (const k of ['persona', 'primaryText', 'headline', 'cta', 'validity', 'compliance']) {
    if (typeof s[k] !== 'string' || !s[k]) issues.push(`"${k}" is required — the judge's checks run on it (missing ${k} killed three judge inputs in run 1)`);
  }
  if (!s.hook || typeof s.hook.text !== 'string' || !s.hook.text) issues.push('hook.text is required');
  if (!s.visual || typeof s.visual.productZone !== 'string' || !Array.isArray(s.visual.palette)) issues.push('"visual" needs at least productZone (from the viewed pixels) and palette (brand hexes array)');
  // S155 F24 + F25: on-image strings = hook/headline/cta + everything in visual.
  const onImage: Array<[string, unknown]> = [['hook.text', s.hook?.text], ['headline', s.headline], ['cta', s.cta]];
  if (s.visual && typeof s.visual === 'object') for (const [k, v] of Object.entries(s.visual)) onImage.push([`visual.${k}`, v]);
  for (const [label, val] of onImage) {
    if (typeof val !== 'string') continue;
    if (PLACEHOLDER_RE.test(val)) issues.push(`${label} carries a bracketed placeholder ("${val.match(PLACEHOLDER_RE)![0]}") — ON-IMAGE strings render literally (run 2 shipped "[Rate]%" as visible pixels). Fill it from a research artifact or drop the element; placeholders are legal ONLY in primaryText (the caption, filled at launch)`);
    if (VIDEO_CHROME_RE.test(val)) issues.push(`${label} stages video chrome ("${val.match(VIDEO_CHROME_RE)![0]}") — lite ships STATIC images only: no play buttons, no poster frames, no video stills (run 2 shipped a fake play button promising a video that does not exist). A video sourcePick transfers its CONSTRUCTION, never its delivery format`);
  }
  if (!Array.isArray(s.anchors) || s.anchors.length === 0) issues.push('"anchors" must list the research artifact numbers this copy uses — every number traces or the judge kills it');
  if (!Array.isArray(s.renderRefs)) issues.push('"renderRefs" must be an array (empty only for deliberately product-free constructions)');
  else for (const ref of s.renderRefs) {
    // S155 F28: BOTH render providers reject SVG refs (run 2: all four ads shipped
    // model-drawn logos). Capture rasterizes the logo to PNG at step 0.
    if (typeof ref === 'string' && /\.svg$/i.test(ref)) issues.push(`renderRefs "${ref}" is an SVG — both render providers reject SVG refs and the mark would be model-DRAWN instead of bound. Reference the rasterized PNG (capture writes assets/logo-site.png); if no PNG exists, drop the ref and name the blocker in the spec`);
  }
  return allProblems(issues);
}

const KILL_CHECKS = new Set(['ANCHOR', 'FABRICATION', 'SOURCE', 'COMPLIANCE', 'PRODUCT-TRUTH']);
const OUTCOME_RE = /^(NORMAL|THIN|FAILED)\b/;

/** The judge's verdict.json must parse into the rubric's exact shape — returns
 *  null when valid, else EVERY precise reason at once (F26; exported for testing). */
export function verdictProblem(content: string): string | null {
  let v: any;
  try { v = JSON.parse(content); } catch (e) { return `not valid JSON (${e instanceof Error ? e.message : String(e)})`; }
  if (!Array.isArray(v?.specs) || v.specs.length === 0) return 'missing "specs" array (one entry per spec file)';
  const issues: string[] = [];
  for (const s of v.specs) {
    if (typeof s?.id !== 'string' || !s.id) { issues.push('a specs[] entry is missing its "id"'); continue; }
    if (s.verdict !== 'SHIP' && s.verdict !== 'KILL') issues.push(`spec ${s.id}: "verdict" must be exactly "SHIP" or "KILL"`);
    if (!Array.isArray(s.kills)) issues.push(`spec ${s.id}: "kills" must be an array (empty on SHIP)`);
    else {
      for (const k of s.kills) {
        if (!KILL_CHECKS.has(String(k?.check))) issues.push(`spec ${s.id}: kill check "${k?.check}" is not one of ${[...KILL_CHECKS].join('|')}`);
        if (typeof k?.evidence !== 'string' || k.evidence.length < 10) issues.push(`spec ${s.id}: every kill needs an "evidence" string (what exactly failed, against what)`);
      }
      if (s.verdict === 'KILL' && s.kills.length === 0) issues.push(`spec ${s.id}: KILL verdict with an empty kills[] — name the failed check + evidence`);
    }
    if (s.verdict === 'KILL' && (typeof s.autopsyLine !== 'string' || s.autopsyLine.length < 10)) issues.push(`spec ${s.id}: killed specs need an actionable "autopsyLine"`);
    if (!Array.isArray(s.flags)) issues.push(`spec ${s.id}: "flags" must be an array`);
    if (typeof s.rank !== 'number') issues.push(`spec ${s.id}: "rank" must be a number (1..N across all specs)`);
    // S155 F12: caption sanitation — a SHIP spec whose CAPTION carries a false/unanchored
    // claim lists the exact strings; the orchestrator routes them to a scoped create edit.
    // S156: null means "none" (run 5's judge wrote captionFixes: null and paid a full
    // Opus round-trip for it — an empty answer is not a schema crime).
    if (s.captionFixes !== undefined && s.captionFixes !== null && (!Array.isArray(s.captionFixes) || s.captionFixes.some((x: any) => typeof x !== 'string' || x.length < 5))) {
      issues.push(`spec ${s.id}: "captionFixes" must be an array of exact instructions ("remove 'Ships today'") — or omit it / null / [] when there are none`);
    }
  }
  const b = v.batch;
  if (!b) issues.push('missing "batch" object');
  else {
    if (typeof b.diversityAudit !== 'string' || b.diversityAudit.length < 20) issues.push('"batch.diversityAudit" must be the test-design read in prose');
    if (!Array.isArray(b.shipList)) issues.push('"batch.shipList" must be a ranked array of spec ids');
    else {
      const shipped = v.specs.filter((s: any) => s.verdict === 'SHIP').map((s: any) => s.id);
      for (const id of b.shipList) if (!shipped.includes(id)) issues.push(`shipList contains "${id}" which is not a SHIP-verdict spec`);
    }
    if (typeof b.batchOutcome !== 'string' || !OUTCOME_RE.test(b.batchOutcome)) issues.push('"batch.batchOutcome" must start with NORMAL, THIN, or FAILED');
  }
  return allProblems(issues);
}

// ── Options — the single source of truth for the lite orchestrator ──────────
export interface LiteOptionsArgs {
  brandUrl: string;
  runDir: string;
  onProgress?: (line: string) => void;
  canUseTool?: Options['canUseTool'];
  resumeSessionId?: string;
}

export function buildLiteOptions({ brandUrl, runDir, onProgress, canUseTool, resumeSessionId }: LiteOptionsArgs): Options {
  const founderDomain = (() => { try { return new URL(brandUrl).hostname; } catch { return brandUrl; } })();

  const hooks = buildHooks({
    // gathering caps: research makes ONE perplexity batch (cap 4 = headroom for a retry);
    // the field seat's harvest/hunt tools are deterministic one-shots outside the
    // gathering-tool list — its cap only guards stray perplexity/WebFetch use.
    caps: { research: 4, field: 8 },
    defaultCap: 12,
    specs: { dir: join(runDir, 'creatives'), out: join(runDir, 'creatives.json') },
    doneRequires: [
      join(runDir, 'research.md'),
      join(runDir, 'field', 'picks.jsonl'),
      join(runDir, 'field', 'field-summary.json'),
      join(runDir, 'creatives.json'),
      join(runDir, 'verdict.json'),
      join(runDir, 'build-output.md'),
    ],
    donePath: join(runDir, 'DONE.md'),
    onEvent: (m) => onProgress?.(m),
    brandUrl,
    // S155 (founder call): the orchestrator's ONE MCP exemption — founder names
    // catalogue products during intake, the deterministic downloader fetches
    // their pack shots. Everything else stays behind the blanket block.
    orchestratorMcpAllow: [CAPTURE_PRODUCTS_TOOL],
  })!;

  // lite guard 1: deterministic Write-validation on EVERY cross-seat JSON artifact
  // (S155 F9 — the verdict hook caught a malformed first write live in run 1; the
  // pattern now covers research, field-summary, picks, and specs too).
  const denyWrite = (file: string, problem: string) => {
    onProgress?.(`⛔ ${file} refused: ${problem}`);
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse' as const,
        permissionDecision: 'deny' as const,
        permissionDecisionReason: `${file} refused — ${problem}. Fix and write again (the schema is in your law).`,
      },
    };
  };
  const loadManifestLanes = (): Map<string, { lane: string }> => {
    const m = new Map<string, { lane: string }>();
    try {
      const j = JSON.parse(fs.readFileSync(join(runDir, 'field', 'manifest.json'), 'utf8'));
      for (const c of j.candidates ?? []) m.set(String(c.id), { lane: String(c.lane) });
    } catch { /* pre-harvest — pick validation will fail on unknown id anyway */ }
    return m;
  };
  // Pick files are the source of truth for ids AND the "p<N>" aliases (F27) AND
  // the uniqueness map (F22) — read directly; picks.jsonl is assembled FROM them.
  const readPickFiles = (): Array<{ file: string; id: string }> => {
    const out: Array<{ file: string; id: string }> = [];
    try {
      const dir = join(runDir, 'field', 'picks');
      for (const f of fs.readdirSync(dir)) {
        if (!/^p\d+\.json$/.test(f)) continue;
        try {
          const id = String(JSON.parse(fs.readFileSync(join(dir, f), 'utf8'))?.id ?? '');
          if (id) out.push({ file: f, id });
        } catch { /* mid-write / invalid — skip */ }
      }
    } catch { /* no picks yet */ }
    return out;
  };
  const loadPickIndex = (): PickIndex => {
    const ids = new Set<string>();
    const aliases = new Map<string, string>();
    for (const { file, id } of readPickFiles()) { ids.add(id); aliases.set(file.replace(/\.json$/, ''), id); }
    return { ids, aliases };
  };
  // F22: every candidate id already claimed by ANOTHER pick file (self excluded —
  // rewriting p5 after a denial must not collide with itself).
  const loadOtherPickIds = (selfPath: string): Map<string, string> => {
    const self = selfPath.split('/').pop();
    const out = new Map<string, string>();
    for (const { file, id } of readPickFiles()) if (file !== self && !out.has(id)) out.set(id, file.replace(/\.json$/, ''));
    return out;
  };
  const loadOpenLaneType = (): string | null => {
    try { return String(JSON.parse(fs.readFileSync(join(runDir, 'field', 'field-summary.json'), 'utf8'))?.openLane?.type ?? null); } catch { return null; }
  };
  // F23: what the hunt ACTUALLY found — an off-format hunt counts as "found nothing".
  const loadHuntOutcome = (): HuntOutcome => {
    try {
      const j = JSON.parse(fs.readFileSync(join(runDir, 'field', 'manifest-hunt.json'), 'utf8'));
      return j?.huntFoundFormat === true ? 'found-format' : 'found-nothing';
    } catch { return 'no-hunt'; }
  };
  // S156: the harvest's REAL download-failure record — honesty[] may not claim more.
  const loadImageFailures = (): ImageDownloadRecord | null => {
    try {
      const d = JSON.parse(fs.readFileSync(join(runDir, 'field', 'manifest.json'), 'utf8'))?.field?.imageDownloads;
      return d && typeof d.failed === 'number' ? { failed: d.failed, failedIds: d.failedIds ?? [] } : null;
    } catch { return null; }
  };
  (hooks.PreToolUse as any[]).push({
    hooks: [
      async (input: any) => {
        if (input?.tool_name !== 'Write' || typeof input?.tool_input?.file_path !== 'string') return { continue: true as const };
        const fp = input.tool_input.file_path;
        const content = String(input?.tool_input?.content ?? '');
        let problem: string | null = null;
        let label = '';
        if (/(^|\/)verdict\.json$/.test(fp)) { label = 'verdict.json'; problem = verdictProblem(content); }
        else if (/(^|\/)research\.md$/.test(fp)) { label = 'research.md'; problem = researchProblem(content); }
        else if (/(^|\/)field\/field-summary\.json$/.test(fp)) { label = 'field-summary.json'; problem = summaryProblem(content, loadImageFailures()); }
        else if (/(^|\/)field\/picks\/p\d+\.json$/.test(fp)) { label = fp.split('/').slice(-1)[0]; problem = pickProblem(content, loadManifestLanes(), loadOtherPickIds(fp)); }
        else if (/(^|\/)creatives\/c\d+\.json$/.test(fp)) { label = fp.split('/').slice(-1)[0]; problem = specProblem(content, loadPickIndex(), loadOpenLaneType(), loadHuntOutcome()); }
        if (problem) return denyWrite(label, problem);
        return { continue: true as const };
      },
    ],
  });

  // S155 F27: sourcePick "p3" (the pick FILE name — how the field summary itself
  // refers to picks) is normalized ON DISK to the candidate id inside that file.
  // The judge Greps picks.jsonl by candidate id, so the alias must not survive.
  // creatives.json is patched too — assembly may already have run with the alias,
  // and PostToolUse hook ordering is not something to lean on.
  const normalizeSourcePick = (fp: string): void => {
    const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const m = /^p(\d+)$/.exec(String(raw?.sourcePick ?? ''));
    if (!m) return;
    const id = String(JSON.parse(fs.readFileSync(join(runDir, 'field', 'picks', `p${m[1]}.json`), 'utf8'))?.id ?? '');
    if (!id) return;
    raw.sourcePick = id;
    fs.writeFileSync(fp, JSON.stringify(raw, null, 2) + '\n');
    const assembled = join(runDir, 'creatives.json');
    if (fs.existsSync(assembled)) {
      const arr = JSON.parse(fs.readFileSync(assembled, 'utf8'));
      const entry = Array.isArray(arr) ? arr.find((x: any) => x?.creative === raw.creative) : null;
      if (entry) { entry.sourcePick = id; fs.writeFileSync(assembled, JSON.stringify(arr, null, 2) + '\n'); }
    }
    onProgress?.(`· normalized sourcePick p${m[1]} → ${id} (${fp.split('/').pop()})`);
  };

  // lite guard 2: incremental picks assembly (PostToolUse on field/picks/p<N>.json)
  // + sourcePick alias normalization (PostToolUse on creatives/c<N>.json — F27)
  (hooks.PostToolUse as any[]) = [
    ...((hooks.PostToolUse as any[]) ?? []),
    {
      hooks: [
        async (input: any) => {
          const file = input?.tool_input?.file_path;
          const isWrite = input?.tool_name === 'Write' || input?.tool_name === 'Edit';
          if (isWrite && typeof file === 'string' && /(^|\/)field\/picks\/p\d+\.json$/.test(file)) {
            try { assemblePicks(runDir, onProgress); } catch (err) {
              onProgress?.(`picks assembly failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
            }
          }
          if (isWrite && typeof file === 'string' && /(^|\/)creatives\/c\d+\.json$/.test(file)) {
            try { normalizeSourcePick(file); } catch (err) {
              onProgress?.(`sourcePick normalization failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
            }
          }
          return { continue: true as const };
        },
      ],
    },
  ];

  // S155 F19: canUseTool only fires for tools OUTSIDE allowedTools — and run 1's
  // fallback allowed EVERYTHING (the orchestrator improvised with ToolSearch +
  // SendMessage; Bash would have been equally allowed). Deny-by-default now:
  // AskUserQuestion delegates to the chat handler; SendMessage/ToolSearch/TaskOutput
  // are SANCTIONED (SendMessage is the official stall-recovery nudge — F18, it
  // rescued the halted research seat cheaper than a relaunch); all else is denied.
  const SANCTIONED_EXTRAS = new Set(['SendMessage', 'ToolSearch', 'TaskOutput']);
  const gatedCanUseTool: Options['canUseTool'] = async (toolName, input, ...rest: any[]) => {
    if (toolName === 'AskUserQuestion' && canUseTool) return (canUseTool as any)(toolName, input, ...rest);
    if (SANCTIONED_EXTRAS.has(toolName)) return { behavior: 'allow', updatedInput: input as Record<string, unknown> };
    onProgress?.(`⛔ tool denied (not in the lite allowlist): ${toolName}`);
    return { behavior: 'deny', message: `${toolName} is not in the lite pipeline's allowlist. Work with your granted tools; if a seat stalled, use SendMessage to nudge it.` };
  };

  const options: Options = {
    cwd: runDir,
    model: 'claude-sonnet-4-6',
    systemPrompt: liteOrchestratorPrompt(brandUrl, runDir),
    settingSources: [],
    strictMcpConfig: true,
    mcpServers: {
      perplexity: perplexityMcpServer,
      field: createHarvestServer(runDir, founderDomain),
      render: createRenderServer(join(runDir, 'renders'), runDir),
      capture: createCaptureProductsServer(runDir, founderDomain),
    },
    // Edit added (create's granted tool — in run 1 it only worked through the F19 hole).
    allowedTools: ['Agent', 'Task', 'Read', 'Glob', 'Grep', 'Write', 'Edit', ...ALL_MCP_TOOLS],
    // S155 F30: the SDK auto-approves sandboxed read-only Bash BEFORE consulting
    // canUseTool — the run-2 orchestrator ran `ls` straight past deny-by-default.
    // disallowedTools is enforced ahead of that auto-approval; the callback gate
    // below still covers everything else.
    disallowedTools: ['Bash'],
    agents: buildLiteAgents(runDir),
    hooks,
    ...(resumeSessionId ? { resume: resumeSessionId } : {}),
    maxTurns: 100,
    // Runaway guard, not the target (~$3 §7). Post-S155-fixes expectation ≈ $4.5-5;
    // 12 = ~2.5x headroom. (Was 25 during run 1's cache-thrash — F14 fixed.)
    maxBudgetUsd: 12,
    canUseTool: gatedCanUseTool,
  };
  return options;
}
